import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { operations } from '../entities/operationsApi'
import type { Product } from '../entities/types'
import { Field } from '../shared/ui/Field'
import { ErrorState, InlineError, Loading } from '../shared/ui/State'
import { errorMessage } from '../shared/api/baseApi'
import { Modal } from '../shared/ui/Modal'
import { money } from '../shared/lib/format'

const schema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Латиница, цифры и дефисы'),
  description: z.string().max(2000),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Укажите цену, например 420.00'),
  menu_category_id: z.string().uuid('Выберите категорию'),
  is_available: z.boolean(),
})
type Form = z.infer<typeof schema>

export function MenuEditor({ restaurantId }: { restaurantId: string }) {
  const menu = operations.useMerchantMenuQuery(restaurantId),
    [create, state] = operations.useCreateProductMutation()
  const [category, categoryState] = operations.useCreateCategoryMutation()
  const [adding, setAdding] = useState(false),
    [categoryName, setCategoryName] = useState(''),
    [categorySlug, setCategorySlug] = useState('')
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      price: '',
      menu_category_id: '',
      is_available: true,
    },
  })
  return (
    <section>
      <div className="section-heading">
        <h2>Меню ресторана</h2>
        <button className="button" onClick={() => setAdding(true)}>
          Добавить блюдо
        </button>
      </div>
      {menu.isLoading ? (
        <Loading />
      ) : menu.error ? (
        <ErrorState error={menu.error} retry={menu.refetch} />
      ) : (
        <div className="dashboard-table">
          {menu.data?.products.map((product) => (
            <ProductEditor key={product.id} product={product} />
          ))}
        </div>
      )}
      <details className="panel" style={{ marginTop: 24 }}>
        <summary>Добавить категорию</summary>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void category({
              restaurant_id: restaurantId,
              name: categoryName,
              slug: categorySlug,
              sort_order: menu.data?.categories.length || 0,
            })
          }}
        >
          <Field
            label="Название категории"
            required
            minLength={1}
            maxLength={100}
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
          />
          <Field
            label="Код категории (латиница)"
            required
            pattern="[a-z0-9-]+"
            value={categorySlug}
            onChange={(event) => setCategorySlug(event.target.value)}
          />
          <InlineError>{categoryState.error ? errorMessage(categoryState.error) : ''}</InlineError>
          {categoryState.isSuccess && <p role="status">Категория добавлена</p>}
          <button className="button" disabled={categoryState.isLoading}>
            Сохранить категорию
          </button>
        </form>
      </details>
      {adding && (
        <Modal title="Новое блюдо" onClose={() => setAdding(false)}>
          <form
            onSubmit={form.handleSubmit(async (data) => {
              const result = await create({ ...data, restaurant_id: restaurantId })
              if ('data' in result) {
                form.reset()
                setAdding(false)
              }
            })}
            noValidate
          >
            <Field label="Название" {...form.register('name')} error={form.formState.errors.name?.message} />
            <Field
              label="Код (латиница и дефисы)"
              {...form.register('slug')}
              error={form.formState.errors.slug?.message}
            />
            <Field
              label="Описание и состав"
              {...form.register('description')}
              error={form.formState.errors.description?.message}
            />
            <Field
              label="Цена, сом"
              inputMode="decimal"
              {...form.register('price')}
              error={form.formState.errors.price?.message}
            />
            <div className="field">
              <label htmlFor="menu-category">Категория</label>
              <select id="menu-category" {...form.register('menu_category_id')}>
                <option value="">Выберите категорию</option>
                {menu.data?.categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.menu_category_id && (
                <span className="field-error">{form.formState.errors.menu_category_id.message}</span>
              )}
            </div>
            <InlineError>{state.error ? errorMessage(state.error) : ''}</InlineError>
            <button className="button full" disabled={state.isLoading}>
              Добавить блюдо
            </button>
          </form>
        </Modal>
      )}
    </section>
  )
}

function ProductEditor({ product }: { product: Product }) {
  const [update, state] = operations.useUpdateProductMutation(),
    [remove, removeState] = operations.useDeleteProductMutation(),
    [upload, uploadState] = operations.useUploadProductMutation()
  const [editing, setEditing] = useState(false),
    [price, setPrice] = useState(product.price),
    [name, setName] = useState(product.name)
  return (
    <div className="dashboard-row">
      <div>
        <strong>{product.name}</strong>
        <p>
          {money(product.price)} · {product.is_available ? 'В наличии' : 'Недоступно'}
        </p>
      </div>
      <div className="button-row">
        <button className="button secondary" onClick={() => setEditing(true)}>
          Изменить
        </button>
        <button
          className="button secondary"
          disabled={state.isLoading}
          onClick={() => void update({ id: product.id, is_available: !product.is_available })}
        >
          {product.is_available ? 'Стоп-лист' : 'Вернуть в меню'}
        </button>
      </div>
      <InlineError>{state.error ? errorMessage(state.error) : ''}</InlineError>
      {editing && (
        <Modal title="Редактирование блюда" onClose={() => setEditing(false)}>
          <form
            onSubmit={async (event) => {
              event.preventDefault()
              const result = await update({ id: product.id, price, name })
              if ('data' in result) setEditing(false)
            }}
          >
            <Field
              label="Название"
              required
              minLength={2}
              maxLength={200}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Field
              label="Цена, сом"
              required
              pattern="[0-9]+(\.[0-9]{1,2})?"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
            <button className="button" disabled={state.isLoading}>
              Сохранить
            </button>
          </form>
          <div className="field">
            <label htmlFor={`photo-${product.id}`}>Фотография блюда (JPEG, PNG, WebP, до 5 МБ)</label>
            <input
              id={`photo-${product.id}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploadState.isLoading}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void upload({ id: product.id, file })
              }}
            />
          </div>
          {uploadState.isSuccess && <p className="notice">Фото загружено</p>}
          <InlineError>
            {uploadState.error
              ? errorMessage(uploadState.error)
              : state.error
                ? errorMessage(state.error)
                : removeState.error
                  ? errorMessage(removeState.error)
                  : ''}
          </InlineError>
          <button
            className="text-link"
            disabled={removeState.isLoading}
            onClick={() => void remove(product.id)}
          >
            Скрыть блюдо из меню
          </button>
        </Modal>
      )}
    </div>
  )
}
