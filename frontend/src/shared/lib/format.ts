export const money = (value: string | number) =>
  `${new Intl.NumberFormat('ru-KG', { maximumFractionDigits: 2 }).format(Number(value))} сом`
export const dateTime = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bishkek',
  }).format(new Date(value))
