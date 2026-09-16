# PDF Decks (Poison Dart Frog Decks)
![Website Icon](images/poisonDart.png)
[My Notes](notes.md)

An online MTG deckbuilder/tester. Allows you to view cards, create a deck, and do simple goldfishing with the deck (depending on complexity). Multiplayer would allow both sides to do the same testing together or at least view decks of friends

> [!NOTE]
> This is a template for your startup application. You must modify this `README.md` file for each phase of your development. You only need to fill in the section for each deliverable when that deliverable is submitted in Canvas. Without completing the section for a deliverable, the TA will not know what to look for when grading your submission. Feel free to add additional information to each deliverable description, but make sure you at least have the list of rubric items and a description of what you did for each item.

> [!NOTE]
> Markdown Reference [documentation](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)

### Elevator pitch

PDF Decks is a quick and easy website to build, share, and playtest MTG decks with friends. You have access to every card from MTG in one place allowing you to easily find new cards, test them, and edit your deck to improve it. Once you're all done, you can play with friends or just share your decklist with them in a visual manner. It also allows you to save your decks in one location to reference later.

### Design

![Design Image 1](MainDeckBuilder.png)
![Design Image 2](LandingPage.png)

The "Main Deck Builder" image shows what will likely be the most common page on the site. It's where most of the actual content is. The "Landing Page" is the first page you see when you look at the website. It will likely have a little more text and visuals to describe the website, but this is a rough sketch of what else could be there.

### Key features

- Able to store deck lists for registered users
- Able to pull up visuals for each card being used (Scryfall API)
- Able to easily import and export decklists to share with other people (e.g. Copy to clipboard)
- Able to save "Friends" to view their decklists (base) or easily play a game with (If complexity and scope allows)
- Able to Goldfish (AKA Playtest) decks in a solo environment or with others (If complexity and scope allows)

### Technologies

I am going to use the required technologies in the following ways.

- **HTML** - Home page with links to personal and public decks. Page to view your own decks and edit the cards inside of them. Once inside a deck, links to playtesting
- **CSS** - Small animations for hovering over cards. Visualing showing the whole deck list laid out as well as the animations for pulling up the card.
- **React** - Animations when hovering over cards or playing them when goldfishing. Clicking on a card should tap the card. Options to interact with cards in other ways. After logging in to website, you see your personal decks
- **Service** - Retrieves stored decks and cards from database. Supports logging in and logging out. Generates a link for others to view your decklist. Uses Scryfall API to retrieve images tied to MTG cards so you have visuals
- **DB/Login** - Allows users to create decks, playtest them, and view cards, but only saves them for later if logged in. May need to store a list of all MTG card names as well.
- **WebSocket** - Connects users together to be able to "play" a game together when they have completed decklists. Also displays other decklists created by other users or friends

## 🚀 Specification Deliverable

> [!NOTE]
> Fill in this sections as the submission artifact for this deliverable. You can refer to this [example](https://github.com/webprogramming260/startup-example/blob/main/README.md) for inspiration.

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] I completed the prerequisites for this deliverable (Git commit requirement)
- [x] Proper use of Markdown
- [x] A concise and compelling elevator pitch
- [x] Description of key features
- [x] Description of how you will use each technology including your 3rd party API and use of WebSocket
- [x] One or more rough sketches of your application. Images must be embedded in this file using Markdown image references.

## 🚀 AWS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Rented EC2 server** - Followed all directions and leased the server.
- [x] **Leased domain name** - Leased the domain name for my website.
- [x] **Server accessible** from my domain: [https://pdfdecks.click](https://pdfdecks.click) - The server work using the DNS name as well as the IP address

## 🚀 HTML deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] I completed the prerequisites for this deliverable (Simon deployed, GitHub link, Git commits)
- [ ] **HTML pages** - I did not complete this part of the deliverable.
- [ ] **Proper HTML element usage** - I did not complete this part of the deliverable.
- [ ] **Links** - I did not complete this part of the deliverable.
- [ ] **Text** - I did not complete this part of the deliverable.
- [ ] **3rd party API placeholder** - I did not complete this part of the deliverable.
- [ ] **Images** - I did not complete this part of the deliverable.
- [ ] **Login placeholder** - I did not complete this part of the deliverable.
- [ ] **DB data placeholder** - I did not complete this part of the deliverable.
- [ ] **WebSocket placeholder** - I did not complete this part of the deliverable.

## 🚀 CSS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] I completed the prerequisites for this deliverable (Simon deployed, GitHub link, Git commits)
- [ ] **Visually appealing colors and layout. No overflowing elements.** - I did not complete this part of the deliverable.
- [ ] **Use of a CSS framework** - I did not complete this part of the deliverable.
- [ ] **All visual elements styled using CSS** - I did not complete this part of the deliverable.
- [ ] **Responsive to window resizing using flexbox and/or grid display** - I did not complete this part of the deliverable.
- [ ] **Use of a imported font** - I did not complete this part of the deliverable.
- [ ] **Use of different types of selectors including element, class, ID, and pseudo selectors** - I did not complete this part of the deliverable.

## 🚀 React part 1: Routing deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] I completed the prerequisites for this deliverable (Simon deployed, GitHub link, Git commits)
- [ ] **Bundled using Vite** - I did not complete this part of the deliverable.
- [ ] **Components** - I did not complete this part of the deliverable.
- [ ] **Router** - I did not complete this part of the deliverable.

## 🚀 React part 2: Reactivity deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] I completed the prerequisites for this deliverable (Simon deployed, GitHub link, Git commits)
- [ ] **All functionality implemented or mocked out** - I did not complete this part of the deliverable.
- [ ] **Hooks** - I did not complete this part of the deliverable.

## 🚀 Service deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] I completed the prerequisites for this deliverable (Simon deployed, GitHub link, Git commits)
- [ ] **Node.js/Express HTTP service** - I did not complete this part of the deliverable.
- [ ] **Static middleware for frontend** - I did not complete this part of the deliverable.
- [ ] **Calls to third party endpoints** - I did not complete this part of the deliverable.
- [ ] **Backend service endpoints** - I did not complete this part of the deliverable.
- [ ] **Frontend calls service endpoints** - I did not complete this part of the deliverable.
- [ ] **Supports registration, login, logout, and restricted endpoint** - I did not complete this part of the deliverable.
- [ ] **Uses BCrypt to hash passwords** - I did not complete this part of the deliverable.

## 🚀 DB deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] I completed the prerequisites for this deliverable (Simon deployed, GitHub link, Git commits)
- [ ] **Stores data in MongoDB** - I did not complete this part of the deliverable.
- [ ] **Stores credentials in MongoDB** - I did not complete this part of the deliverable.

## 🚀 WebSocket deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] I completed the prerequisites for this deliverable (Simon deployed, GitHub link, Git commits)
- [ ] **Backend listens for WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **Frontend makes WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **Data sent over WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **WebSocket data displayed** - I did not complete this part of the deliverable.
- [ ] **Application is fully functional** - I did not complete this part of the deliverable.
