# PLAIN Design Hub Design

**Goal:** Build an internal no-login web app for managing PLAIN product redesign work from KTW-sourced saw blade SKUs.

**Users:** Designers and operations staff who need to see the required purchase list, redesign each SKU, upload product redesign images, packaging designs, and factory-ready files.

**Core workflow:** A user opens the dashboard, searches or filters SKUs, selects one product, updates design status, adds notes, and uploads multiple files into three groups: product images, packaging images, and factory files.

**Data model:** Products are grouped by unique SKU. Duplicate order lines from the source order are aggregated into a single `order_quantity`. Supabase stores product metadata and file records; Supabase Storage stores uploaded files under `design-assets/<SKU>/<group>/...`.

**No login requirement:** The app uses the public Supabase client key. The SQL policy intentionally permits anonymous read/write for this internal workflow, and the UI warns when Supabase is not configured.

**Deployment:** Vite React static site deployed to Render with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set as environment variables.
