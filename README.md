# PLAIN Design Hub

เว็บสำหรับติดตามงานรีดีไซน์สินค้า PLAIN จากรายการ SKU ของ KTW พร้อมสถานะงาน, ราคา, จำนวนสั่งซื้อ, รูปสินค้าอ้างอิง และพื้นที่อัปโหลดไฟล์หลายไฟล์ต่อช่องสำหรับทีมออกแบบกับโรงงาน

## Deploy on Render

1. เปิด Render Blueprint:
   https://dashboard.render.com/blueprint/new?repo=https%3A%2F%2Fgithub.com%2Fpongsathornkit-cmd%2Fplain-design-hub
2. เลือก repo `pongsathornkit-cmd/plain-design-hub`
3. กด `Apply`

เว็บจะเปิดได้ทันทีในโหมด Demo ถ้ายังไม่ใส่ Supabase ค่าในโหมดนี้เก็บใน browser ของเครื่องที่ใช้งานเท่านั้น

## เปิดใช้ Supabase สำหรับเก็บข้อมูลจริง

1. สร้าง Supabase project
2. เปิด SQL Editor แล้วรันไฟล์ `supabase/migrations/001_plain_design_hub.sql`
3. ใน Render dashboard ของเว็บนี้ ไปที่ Environment แล้วเพิ่ม:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. กด Manual Deploy อีกครั้ง

หมายเหตุ: โปรเจกต์นี้ตั้งใจให้ไม่ต้อง login ตามโจทย์ ดังนั้น policy ใน Supabase เปิดให้ผู้ที่มีลิงก์เว็บอ่าน แก้สถานะ อัปโหลด และลบไฟล์ได้ ควรแชร์ลิงก์เฉพาะคนในทีม
