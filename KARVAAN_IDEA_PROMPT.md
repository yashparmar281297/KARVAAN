# KARVAAN — Product Idea Prompt

> Copy everything below this line and give it to any AI builder, designer or developer. It describes the whole product idea from start to finish.

---

## The idea in one line

**KARVAAN is India's home for the automotive community.** Supercar, superbike and custom-mod owners, clubs, event organisers, automotive businesses and everyday enthusiasts all come together on one premium platform to show their machines, find their people and drive together.

*Karvaan* means "caravan": a convoy of people moving together. That is the feeling the product should give.

---

## The problem

India's car and bike culture is growing fast, but it is scattered:

- Owners show their machines on Instagram, where they get lost among everything else.
- Clubs run on WhatsApp groups with no public face, no proper member list and no way for new people to find them.
- Drives, rides, meets and track days are announced in group chats and posters, with messy registrations.
- Enthusiasts who don't own a supercar have nowhere to follow the scene properly.
- Detailers, tuners, wrap studios and dealers can't reach this audience directly.

## The solution

One platform where:

- every **vehicle** gets its own beautiful page,
- every **owner** has a profile and a garage,
- every **club** has a home, members and an admin console,
- every **event** has a page, registration and an organiser dashboard,
- every **business** has a listing with services, followers and reviews,
- and everyone can **follow, like, save and join** what they love.

---

## Who it is for (one account, chosen once)

Everyone has **one free account**. At sign-up the person answers **"What describes you?"** and can pick one or more of the options below. **This choice is permanent.** It can't be changed later, and it decides what the account can create.

| Category | What they can do |
|---|---|
| **Automotive enthusiast** | Browse everything, follow, like, save, join clubs, register for events. **Cannot create** a garage, vehicles, clubs, events or a business. |
| **Supercar owner** | Create a garage and add cars, join clubs, follow, register for events. |
| **Superbike owner** | Create a garage and add bikes, join clubs, follow, register for events. |
| **Custom mods (cars or bikes)** | Garage for modified cars and bikes (each vehicle lists its mods). Join clubs, follow, register for events. |
| **Club organizer** | Create and run clubs, approve or reject join requests, manage members, create events. |
| **Event organizer** | Create and manage drives, rides, meets and track days, and see registrations. |
| **Automotive business** | List the business and its services, gain followers and receive reviews. |

The server enforces every permission, not just the interface. **"Club member"** is earned by being accepted into a club; nobody selects it.

A separate **site admin** (passcode-protected) can edit or remove anything on the platform.

---

## Core principles

1. **Browse first, sign up later.** Every public page is open to visitors without an account.
2. **Login wall with resume.** When a visitor taps Follow, Like, Save, Join or Register, they are asked to sign up or log in. Afterwards they land back on the same page and **the action completes automatically**.
3. **Follow ≠ Join.** Following a club only adds it to your feed. Joining makes you a member, and the club admin may need to approve it.
4. **Privacy by owner.** Every vehicle can be **public, followers-only or private**. The owner can also hide their name from a vehicle's page. Private vehicles are invisible to everyone else and their pages return "not found".
5. **Drafts before publishing.** Events can be saved as drafts and published when ready.
6. **Real numbers only.** Home page stats show the real count of registered members, vehicles and clubs. No fake numbers.
7. **The dashboard adapts.** "My account" shows only the sections that fit the person's categories.

---

## The user journey

### 1. Visitor
Lands on the home page and explores supercars, superbikes, sleepers, clubs, events, routes and businesses without logging in.

### 2. Sign-up (3 steps)
1. **Your account:** name, email or mobile, password.
2. **What describes you:** pick one or more categories (with a "can't be changed later" warning), plus an optional profile photo and city.
3. **Your garage:** owners are asked "Do you want to create your garage?" and can add their first car or bike, or choose Later.

Then they return to wherever they were, and any pending action completes.

### 3. Owner
- Adds vehicles with photos (cropped to a fixed 4:5 frame), make, model, variant, year, colour and specs such as power, torque, 0–100 and top speed.
- Sets each vehicle's visibility.
- Their profile shows their garage, clubs and followers.

### 4. Club organizer
- Creates a club with logo, cover, tagline, category (car, bike or mixed), city and about text.
- Picks a join policy: **open** or **approval required**. The club can also be private.
- Uses the **Manage club** console to approve or reject requests, see members and remove members.
- Creates events on behalf of the club.

### 5. Event organizer
- Creates an event: title, category (drive, ride, meet, track day, show), date and time, city, meeting point, route, cover image, price and seat limit.
- Saves it as a draft or publishes it.
- Uses the **Manage event** dashboard to see registrations and attendees, and to edit, publish or delete the event.

### 6. Enthusiast
- Follows owners, clubs, businesses and events.
- Likes and saves vehicles and events.
- Joins clubs and registers for events.
- Reads a personal **Feed** built from everything they follow.

### 7. Automotive business
- Lists the business with services, location, contact and photos.
- Gets followers and **reviews** (one review per user).

---

## Pages (site map)

**Public**
- `/`: home page with a cinematic hero, real stats, featured vehicles, "Meet the owners" (owners only, never enthusiasts), clubs, upcoming events, and Supercars / Superbikes / Events tiles
- `/cars`, `/bikes`: browse supercars and superbikes
- `/vehicles/[slug]`: vehicle page with gallery, specs, owner, likes and saves
- `/owners/[handle]`: owner profile and garage
- `/clubs`, `/clubs/[slug]`: club directory and club page (members, events, follow, join)
- `/events`, `/events/[slug]`, `/events/[slug]/register`: events, event page and ticket/registration flow
- `/businesses`, `/businesses/[slug]`: business directory, listing and reviews
- `/explore`, `/search`: discover everything

**Account**
- `/join`, `/login`: sign-up wizard and login
- `/me`: dynamic dashboard (garage, clubs, events, business, following, saved)
- `/me/profile`, `/me/vehicles/new`, `/me/vehicles/[slug]/edit`
- `/feed`, `/following`, `/garage`

**Create and manage (only for the right categories)**
- `/clubs/new`, `/clubs/[slug]/edit`, `/clubs/[slug]/manage`
- `/events/new`, `/events/[slug]/edit`, `/events/[slug]/manage`
- `/businesses/new`, `/businesses/[slug]/edit`
- `/studio`: site-admin studio for all content

If someone opens a create page their account can't use, they see: *"Only Club organizer accounts can create a club. What describes you is chosen once, when the account is created."*

---

## Data model (relationships)

- **User** (account) → has one **Profile** → owns many **Vehicles**
- **User** ↔ **Club** through **Membership** (role: admin or member; status: pending or approved)
- **User** → **Follows** → owner, club, event or business
- **User** → **Likes** and **Saves** → vehicle or event
- **Event** → created by a User, optionally hosted by a Club, linked to a **Route**, and has many **Registrations**
- **Business** → owned by a User, with many **Reviews** (one per user)
- **Vehicle** → visibility (public, followers, private) and an "owner hidden" option

---

## Look and feel

- **Premium, dark and cinematic.** Think of a luxury car launch film, not a classifieds site.
- Near-black and graphite backgrounds, ivory text, silver secondary text, one **ember** (warm orange-red) accent.
- A wide, bold display font for headings in uppercase, a clean sans-serif for body text, and small spaced-out labels.
- Chamfered (cut-corner) buttons, hairline borders and large full-bleed photography.
- Smooth, restrained motion: fades, slides and parallax. Nothing flashy.
- **Mobile-first:** a bottom navigation bar on phones, and vehicle cards that fit on one screen with clearly labelled specs.
- Fixed photo frames, so nothing is ever cropped badly: vehicle and portrait photos 4:5, covers 16:9, logos 1:1 in a circle.

---

## Tech direction

- **Next.js (App Router), React and Tailwind CSS**, with server components and server actions.
- Secure accounts: hashed passwords (scrypt) and a signed httpOnly session cookie.
- Every permission is checked on the server.
- Image uploads are cropped in the browser and checked by their actual file contents on the server (JPEG/PNG only, maximum 8 MB).
- SEO: sitemap, robots.txt and metadata for every public page. Private and account pages are not indexed.
- Starts with a local JSON database, designed so it maps directly onto **Supabase** (Postgres, Auth and Storage) for production.

---

## Future ideas

- Live convoy tracking during drives
- Paid tickets with online payment
- Club chat and event announcements
- Marketplace for parts and pre-owned vehicles
- Verified-owner badges (RC verification)
- Brand and dealer partnerships, sponsored events
- Mobile app (iOS/Android)

---

## Tagline options

- *"Every machine has a story. Every story has a convoy."*
- *"India's automotive community — one road, together."*
- *"Show your machine. Find your people. Drive together."*
