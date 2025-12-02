
export const README_CONTENT = `Travel Summary Generator - Formatting Guide

To ensure your spreadsheet is parsed correctly, please follow these formatting rules:

1. Trip Location & Title
   - The destination name must be in cell C1 (Row 1, Column 3).
   - Example: "Thailand Trip" or "Tokyo Adventure".

2. Daily Schedule
   - Column A (Date): Enter the date (e.g., 11/1/2025) to mark the start of a new day. You only need to enter the date on the first row for that day. All subsequent rows until the next date will be grouped into this day.
   - Column D (Time): Enter the time of the event (e.g., 14:00 or 2:00 PM).
   - Column E (Activity): Enter the description of the activity or location name.

3. Expenses Breakdown
   - Column I: Cost for Person 1.
   - Column J: Category Code (Single Letter).
     - A = Airfare
     - H = Housing
     - F = Food
     - S = Shopping
     - G = Gifts
     - T = Transportation
     - R = Recreation
   - Column K: Cost for Person 2.
   - Column L: Total Cost.

4. Tips
   - Save your file as .CSV or .XLSX before uploading.
   - The app looks for specific column positions, so try to keep the structure similar to the template.
`;

export const TEMPLATE_CSV = `,,Destination,,,,,,,
,,,,,,,,,
,,Travelers,,,Dates,Destination,,,
,,Name,,,,,,,
,,"Things to bring: shirts, pants, socks, swimsuit, underwear, phone charger, watch charger, laptop, laptop charger, hairtie, face cleanser, sunscreen, face cream, lotion, sanitizer, toothbrush, toothpaste, razor and razor blades, plastic bags, shoes, slippers, COVID face masks, water bottle, wallet and ID, purse, backpack",,,,,,,
,,Name,,,,,,,
,,"Outfits
phone charger, watch charger, external battery + cord, outlet converter, travel outlet, hairtie, makeup, cleanser, two face cares, face lotion, face sunscreen, lotion, sanitizer, straightener, curler, hair roller, bobby pins, toothbrush, toothpaste, shaving razor, eyebrow plucker, plastic bags (for dirty clothes and clothes), slippers, 50 COVID face masks, face masks, water bottle, glasses, 15 reusable contacts, contacts case, jewelry, cards, reusable straw, purse, backpack (with water pack and face things)",,,,,,,
,,,,,,,,,
,,,,,,,,,
,,,,,,,,,
,,,,,,,,,
6/3/2022,,,Flight,,,,,$xxx,A
FRI,,,Depart,Airport,Confirmation,Notes,,,
,,,,,,,,,
6/4/2022,,,,,,,,,
SAT,,,Arrive,Airport,Confirmation,,,,
"City
HF/LF
D: Weather
N: Weather
M: Clothes
T: Clothes",,,,,35QPTM,3h 55m layover,,,
,,,,,,,,,
,,,Depart,Airport,Confirmation,Notes,,,
,,,,,,,,$xx,F
,,,,,,,,,
,,,Arrive,Airport,Confirmation,"Delivering all luggages (check in and carry ons), arrives same day",,,
,,,,,,,,,
,,,,,,,,,
,,,,,,,,,
,,,Time,Label,,Notes,,,
,,,7:00,,,,,,
6/5/2022,,,9:00,,,,,,
SUN,,,,,,,,,
"City
HF/LF
D: Weather
N: Weather
M: Clothes
T: Clothes",,,,,,,,,
,,,,,,,,,
,,,,,,,,,
,,,10:50,,,,,,
,,,11:40,,,,,,
,,,12:00,,,,,,
,,,,,,,,,
,,,,,,,,,
,,,13:00,,,,,,
,,,13:30,,,,,,
,,,,,,,,,
,,,,,,,,$xx,F
,,,14:00,,,,,,
,,,15:30,,,,,,
,,,,,,,,,
,,,,,,,,,
,,,EXPENSES EXPENSES EXPENSES EXPENSES EXPENSES EXPENSES EXPENSES EXPENSES EXPENSES EXPENSES EXPENSES EXPENSES,,,,,,
,,,Airfare,,,,,#N/A,
,,,Housing,,,,,#N/A,
,,,Transportation,,,,,#N/A,
,,,Food,,,,,#N/A,
,,,Activities,,,,,#N/A,
,,,Gifts,,,,,#N/A,
,,,Shopping,,,,,#N/A,
,,,TOTAL,,,,,#N/A,`;