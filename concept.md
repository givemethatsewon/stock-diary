A full-page, modern, and clean dashboard for a personal investment diary web application called "Secret Stockholders' Meeting". The design should be minimalist and calming, using a palette of blues, light grays, and a single accent color like green for positive actions.

The layout is composed of three main sections: a header, a main content area with a calendar, and a side panel for diary entries and AI feedback.

**1. Top Header:**
* A fixed header at the top of the page.
* On the far left, the application title: "**주시다**" with a small, subtle icon of a diary or a lock.
* On the far right, a user profile avatar icon.

**2. Main Content Area (Left 2/3 of the screen):**
* This area is dominated by a large, interactive monthly **Calendar** component.
* The calendar should display the current month, with arrows to navigate to previous and next months.
* Today's date should be visually highlighted with a circle or a different background color.
* On dates where a user has written a diary entry, display the corresponding emotion **emoji** (e.g., 😊, 😥, 🤔) directly within the date cell to provide a quick visual summary.
* When a user clicks on any date, the content of the right-hand side panel will update accordingly.

**3. Side Panel (Right 1/3 of the screen):**
* This panel is dynamic and changes based on user interaction with the calendar.

* **Default State (or when a date with no entry is clicked):**
    * It should display a prominent call-to-action.
    * Show a title like "**오늘의 투자 일기**" (Today's Investment Diary).
    * Below the title, present a row of selectable **emotion emojis** (e.g., "😊 기쁨", "😥 슬픔", "🤔 고민", "🔥 분노", "🤩 환희").
    * A large multi-line **textarea** for the user to write their diary entry. Placeholder text should read: "오늘의 투자 경험, 생각, 다짐을 자유롭게 기록해보세요." (Freely record today's investment experience, thoughts, and resolutions.)
    * An "Add Photo" **button** with a paperclip icon.
    * A primary "일기 저장하기" (Save Diary) **button** at the bottom.

* **Display State (when a date with an existing entry is clicked):**
    * The panel switches to a read-only view of the saved entry.
    * At the top, show the selected **date** and the chosen **emotion emoji**.
    * If a photo was uploaded, display the **image** prominently.
    * Display the user's saved **diary text** in a clean, readable format.
    * Below the user's entry, create a visually distinct section with a slightly different background color, titled "**🤖 AI의 피드백**" (AI's Feedback). This section will display the AI-generated analysis and advice.
    * At the bottom, include an "수정하기" (Edit) button and a "삭제하기" (Delete) button.

