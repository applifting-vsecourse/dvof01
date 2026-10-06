# User Story: Search Quacks by Text or Author

## Story

**As a** Quacker user,  
**I want to** search for posts by typing a keyword or an author's name into a search input,  
**So that** I can quickly find a post I saw previously without scrolling through the entire feed.

## Acceptance Criteria

- [ ] **AC1: Search Input Visibility**
  - **Given** a user is logged in and on the Quacks feed page (`/quacks`),
  - **When** the page renders,
  - **Then** a search input field labeled "Search quacks..." is visible above the feed list.

- [ ] **AC2: Filter Posts by Text Content**
  - **Given** quacks exist with specific words in their body text,
  - **When** the user types a word from a quack into the search box,
  - **Then** only quacks containing that keyword in their text are displayed in the feed.

- [ ] **AC3: Filter Posts by Author Name or Username**
  - **Given** quacks exist written by specific authors,
  - **When** the user types an author's display name or username into the search box,
  - **Then** only quacks authored by matching users are displayed in the feed.

- [ ] **AC4: Case-Insensitive Matching**
  - **Given** quacks exist with varying text/author capitalization,
  - **When** the user types search terms in uppercase, lowercase, or mixed case,
  - **Then** matching quacks are found regardless of letter case.

- [ ] **AC5: Clearing Search**
  - **Given** the search input field has text typed in it and the feed is filtered,
  - **When** the user clears the search input field,
  - **Then** the full unfiltered list of quacks is restored.

- [ ] **AC6: Empty State Handling**
  - **Given** the user enters a search query that does not match any post text or author,
  - **When** search results are returned,
  - **Then** search does not execute, list shows the same state.

## Out of Scope

- Advanced search syntax/operators (e.g., AND/OR boolean operators, exact phrase quotes).
- Date range or mood filtering in search.
- Highlighting matched search terms within post cards.
- Search history or saved search queries.
