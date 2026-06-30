# PLAIN Design Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working React/Supabase dashboard for PLAIN redesign tracking.

**Architecture:** A Vite React app reads product seed data locally when Supabase env vars are missing, and switches to Supabase tables/storage when configured. The UI is a dense operations dashboard with a product list and a selected SKU detail panel.

**Tech Stack:** React, Vite, lucide-react, Supabase JavaScript client, Supabase Postgres/Storage, Render static site.

---

### Task 1: Project Shell

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `.env.example`
- Create: `render.yaml`

- [x] Add Vite React dependencies and static Render configuration.

### Task 2: Data And Supabase

**Files:**
- Create: `src/data/products.js`
- Create: `src/lib/supabaseClient.js`
- Create: `src/services/designRepository.js`
- Create: `supabase/migrations/001_plain_design_hub.sql`

- [x] Add KTW SKU seed data, prices, images, and aggregated order quantities.
- [x] Add Supabase table, storage, grants, and anonymous policies for the no-login workflow.
- [x] Add repository functions for loading products, updating status/notes, and uploading multiple files.

### Task 3: Dashboard UI

**Files:**
- Create: `src/App.jsx`
- Create: `src/main.jsx`
- Create: `src/styles.css`

- [x] Build sidebar navigation, KPI strip, filters, product table, detail panel, status selector, notes field, and three multi-upload areas.

### Task 4: Verification

**Files:**
- Modify as needed after testing.

- [x] Install dependencies.
- [x] Run production build.
- [x] Run local dev server.
- [x] Inspect desktop and mobile screenshots.
- [x] Verify status update and multi-file upload in local demo mode.
