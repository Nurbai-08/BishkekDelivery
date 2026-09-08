"""Local operator CLI: trusted database access is required."""

import argparse

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import CourierProfile, Restaurant, User
from app.models.enums import Role


def main():
    parser = argparse.ArgumentParser(
        description="Assign a role to an existing Firebase-synced user"
    )
    parser.add_argument("--uid", required=True, help="Firebase UID (user must have signed in once)")
    parser.add_argument("--role", required=True, choices=[role.value for role in Role])
    parser.add_argument("--restaurant-slug", help="Assign restaurant ownership")
    parser.add_argument("--approve-courier", action="store_true")
    args = parser.parse_args()
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.firebase_uid == args.uid))
        if not user:
            raise SystemExit("User not found. Sign in to the application first.")
        user.role = Role(args.role)
        if args.restaurant_slug:
            if user.role != Role.RESTAURANT_OWNER:
                raise SystemExit("Restaurant ownership requires RESTAURANT_OWNER role")
            restaurant = db.scalar(
                select(Restaurant).where(Restaurant.slug == args.restaurant_slug)
            )
            if not restaurant:
                raise SystemExit("Restaurant not found")
            restaurant.owner_id = user.id
        if user.role == Role.COURIER:
            profile = db.get(CourierProfile, user.id)
            if not profile:
                profile = CourierProfile(user_id=user.id)
                db.add(profile)
            if args.approve_courier:
                profile.is_verified = True
        db.commit()
        print(f"Role updated: {user.role.value}")


if __name__ == "__main__":
    main()
