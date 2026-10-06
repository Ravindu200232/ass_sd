SE4030 - Secure Software Development
Group assignment submission

Application
-----------
Pubudu Tyres POS / mini-ERP. This is a multi-branch point-of-sale and
inventory application built with a Laravel REST API and a React frontend.
The main areas are invoicing, customer credit, products and services, stock
receiving, discount approvals, branch separation, staff management and
reports.

Group members
-------------
P.A.R.B. Subasingha       IT22098450   Ravindu (leader)
R.M.M.P. Bandara          IT22249166   Malith
R.H.F. Hamna              IT22516916   Hamna
R.M.K.N. Gunasena         IT22078582   Nimathra

Project links
-------------
Original backend:
https://github.com/Chathura876/pubudu-pos-api

Original frontend:
https://github.com/Chathura876/pubudu-pos-front-end

Modified backend:
https://github.com/Ravindu200232/pubudu-pos-api-secure

Modified frontend:
https://github.com/Ravindu200232/pubudu-pos-front-end-secure

The modified repositories keep the original history. The tag
v0-original-vulnerable is the comparison point used for the before/after
review. The final project includes the individual branches and the merged
security changes.

Video link
----------
Paste the final YouTube link here before uploading the submission:
<PASTE_FINAL_YOUTUBE_LINK_HERE>

The video should be no longer than 20 minutes. The final YouTube URL is stored
in video/YOUTUBE_VIDEO_LINK.txt before submission. The PDF report contains
representative application screenshots as supporting evidence.

What was done
-------------
We reviewed the original application, reproduced the security problems, and
then checked the fixes against the same cases. The report records 19 findings:
14 were fixed and 5 were left as documented follow-up work with reasons. The
project also contains a Google OpenID Connect sign-in using Authorization Code
with PKCE. The report explains the decisions, the tests, and each member's
work.

Member work areas
-----------------
Ravindu: access control, session/token lifecycle, and the Google OIDC flow.
Malith: input and business-logic integrity, auditability, and the invoice
request boundary in the frontend.
Hamna: configuration, transport security, dependency checks, CI, and the
security regression tests.
Nimthra: frontend attack-surface fixes and confidentiality of API responses,
including the wholesale-cost exposure issue.

Submission contents
------------------
README.txt                         this file
report/SE4030_SSD_Report.pdf       final report in PDF format
report/SE4030_SSD_Report_Updated.docx  editable report copy
source/demo/                       original and secure local demo projects
source/evidence/                   before/after audit results and PoCs
source/evidence/live-screenshots/  four selected live vulnerability screens
video/YOUTUBE_VIDEO_LINK.txt      final YouTube link placeholder

Dependencies and local environment files are intentionally not included in
the ZIP. This keeps the submission smaller and prevents local database
passwords or API keys from being shared. The normal dependency files
(composer.json, composer.lock, package.json and package-lock.json) are
included, so the project can be installed again on a clean machine.

Running the local demo
----------------------
Requirements: PHP 8.2 or newer, Composer, Node.js 20 or newer, npm, and a
local MySQL/MariaDB service.

1. Open source/demo/secure and run start.bat for the fixed application.
   It starts the secure API on port 8000 and the secure frontend on port 5173.
2. Open source/demo/original and run start.bat for the original application.
   It starts the original API on port 8001 and the original frontend on port
   5174. The original environment file is created from .env copy.example.
3. If a dependency is not installed, the start script installs it. The secure
   backend uses .env.example and the frontend uses .env.example; never copy
   real production credentials into the submission folder.
4. The seeded local accounts used in the demonstration are:

   admin            / Admin@Pass123
   cashier.colombo  / Cashier@Pass123
   cashier.kandy    / Cashier@Pass123

   These accounts are for the local demonstration only.

Checking the evidence
---------------------
The executable PoC runner is source/evidence/poc/run-all.mjs. The before and
after outputs are stored in source/evidence/before and source/evidence/after.
The report gives the exact PHPUnit, frontend, dependency-audit and dynamic
testing results. The final recording link is stored in
video/YOUTUBE_VIDEO_LINK.txt. The PDF report includes representative
application screens for the demonstration evidence.

Report note
-----------
The PDF in this package is the version prepared from the updated report. It
keeps the original report structure and adds the supplied marking-guide
coverage table, the member names/index numbers, GitHub contribution evidence,
and four concise live vulnerability screens. Replace only the video
placeholder above before final upload.
