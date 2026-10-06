# Demo projects run කිරීම

XAMPP එකෙන් **MySQL** පමණක් Start කරන්න. මේ demo එක Apache භාවිතා නොකරයි; Laravel API එක `php artisan serve` මඟින් සහ React site එක Vite මඟින් run වන නිසා කලින් පෙනුණු Apache shutdown ගැටලුව අවශ්‍ය නැහැ.

## Run කරන හැටි

1. පළමු වරට internet connection එක තිබියදී `original/start.bat` සහ `secure/start.bat` වෙන වෙනම double-click කරන්න. අවශ්‍ය Composer සහ npm packages lock files අනුව install කරයි.
2. සෑම project එකකටම වෙනම MySQL database එකක් සකස් කර migrations run කරයි. අලුතින් database එකක් හදන පළමු වතාවේ පමණක් local demo records seed කරයි. තිබෙන database එක නැවත seed කරන්නේ නැහැ.
3. Browser එකෙන් පහත frontend ලිපින විවෘත කරන්න.

| Version | Frontend | API | Database |
|---|---|---|---|
| Original | http://localhost:5174 | http://127.0.0.1:8001 | `pubudu_pos_original` |
| Secure | http://localhost:5173 | http://127.0.0.1:8000 | `pubudu_pos_secure` |

XAMPP MySQL account එක `root` / හිස් password එකට වෙනස් නම්, backend දෙකේම `.env`-හි DB settings MySQL එකට ගැළපෙන ලෙස සකසන්න. Original database එකේ migrations run කරන්නේ secure backend එකේ migration files භාවිතා කරලා. Original source එකේ `adjusted_by` column එක `NOT NULL` තිබියදීම `ON DELETE SET NULL` සම්බන්ධ කරන නිසා MySQL foreign-key error එකක් එනවා. ඒ නිසා original application code වෙනස් නොකර, secure migration schema එකෙන් original DB එක සකසනවා.

## Local demo login

- Admin: `admin` / `Admin@Pass123`
- Colombo cashier: `cashier.colombo` / `Cashier@Pass123`
- Kandy cashier: `cashier.kandy` / `Cashier@Pass123`

මේ accounts local demo එකට පමණයි. Original project එකේ assignment එකට පෙන්වන security දුර්වලතා තවමත් තියෙනවා; npm audit එකෙන් dependency ගැටලු 23ක් හඳුනාගත්තා. ඒ නිසා localhost වලින් පිටතට expose කරන්න එපා.

Server windows වහන විට ඒ project එකේ frontend සහ API command windows දෙකම වසා දමන්න. MySQL එක XAMPP Control Panel එකෙන් වෙනම Stop කළ හැක.
