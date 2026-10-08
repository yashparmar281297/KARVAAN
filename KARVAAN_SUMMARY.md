# KARVAAN — Website Summary

**KARVAAN is India's online home for the automotive community.** Car and bike owners show their machines, clubs find members and run their drives, organisers host events, automotive businesses reach customers, and enthusiasts follow all of it in one place.

*Karvaan* means "caravan": a convoy of people moving together.

---

## The problem it solves

India's car and bike scene is spread across Instagram posts, WhatsApp groups and posters. Owners' machines get lost in feeds, clubs have no public page or member list, events are hard to find and register for, and businesses can't reach this audience directly. KARVAAN puts all of it on one platform.

---

## Who uses it

Everyone gets **one free account**. When signing up, a person chooses **"What describes you?"**, and that choice is **permanent**. It decides what the account can create.

| Account type | What they can do |
|---|---|
| **Automotive enthusiast** | Browse, follow, like, save, join clubs and register for events. Can't create anything. |
| **Supercar owner** | Has a garage and adds cars. |
| **Superbike owner** | Has a garage and adds bikes. |
| **Custom mods (cars or bikes)** | Has a garage for modified cars and bikes. |
| **Club organiser** | Creates and runs clubs, approves join requests, creates events. |
| **Event organiser** | Creates and manages drives, rides, meets and track days. |
| **Automotive business** | Lists the business and its services, and gets followers and reviews. |

A **site admin** (protected by a passcode) can edit or remove anything.

---

## What's on the website

| Section | What it shows |
|---|---|
| **Home** | Big photo hero, real counts of members, vehicles and clubs, featured vehicles, clubs, upcoming events and businesses |
| **Cars / Bikes** | Every public vehicle as a game card, with filters (class, make, city) |
| **Vehicle page** | Photos, full specs, modifications, history log, owner, likes and saves |
| **Owner profile** | The owner's garage, clubs, events and followers. Enthusiasts' profiles have no garage. |
| **Clubs** | Club directory, plus each club's page with members, garage, events and Follow / Join buttons |
| **Events** | Upcoming drives, rides, meets and track days, each with an event page and registration / tickets |
| **Businesses** | Detailers, tuners, wrap studios and more, each with services and reviews |
| **Explore & Search** | Browse by city and category. Search finds cars, bikes, clubs, events, owners and businesses instantly. |
| **Feed** | New vehicles and events from everything you follow |
| **My account** | Your dashboard, showing only the sections that fit your account type |

### Vehicle categories
Supercar, Superbike, Performance, **Sleeper**, Luxury, JDM, Classic, Off-road, Cruiser, Street.

---

## How it works (the main rules)

1. **Look first, sign up later.** Every public page can be viewed without an account.
2. **Sign up, then carry on.** If a visitor taps Follow, Like, Save, Join or Register, they're asked to create an account, then sent back to the same page, and the action completes automatically.
3. **Following is not joining.** Following a club puts it in your feed. Joining makes you a member, and the club admin may need to approve the request.
4. **Owners control privacy.** Each vehicle can be public, followers-only or private, and owners can hide their name on a vehicle.
5. **Events can be drafts** until the organiser publishes them.
6. **Only real numbers.** Every count on the site is real. Enthusiasts are never listed as "owners".

---

## Look and feel

- Premium, dark and cinematic (a light theme is also available)
- Large photos, bold uppercase headings, one orange accent colour
- **Game-style cards**: small cards with a rating number, a photo and stat bars (power, torque, 0–100, top speed for vehicles). Two per row on phones.
- Designed to fit every screen, from 320px phones to large desktop monitors

---

## Mobile app

- **Android:** a test APK (`mobile/KARVAAN-test.apk`) that opens the website inside a native app, with the KARVAAN icon, a splash screen and an offline screen. Website updates appear in the app automatically.
- **iOS:** the Xcode project is ready in `mobile/ios`. It has to be built on a Mac.

---

## Built with

- **Next.js 16, React 19 and Tailwind CSS**
- **Accounts:** secure passwords and sessions, with every permission checked on the server
- **Images:** photo upload with in-browser cropping to fixed frames
- **Data:** a local database for now, ready to move to **Supabase** for the live launch
- **SEO:** sitemap, robots.txt and page titles and descriptions; private pages are hidden from search engines
- **App wrapper:** Capacitor, for the Android and iOS apps

---

## Next steps to launch

1. Put the website online on a real domain (for example karvaan.in).
2. Move the data to Supabase.
3. Rebuild the Android app to use the live address, then publish it on the Play Store.
4. Build the iOS app on a Mac and publish it on the App Store.
