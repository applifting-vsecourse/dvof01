# User Story: Polls in Quacks

## Story

**As a** Quacker user,  
**I want to** attach a poll with selectable answer options to my quack, and let others vote and see live counts,  
**So that** we can quickly make group decisions (like where to go for lunch) without manually counting replies or getting lost in comment threads.

---

## Acceptance Criteria

### AC1: Creating a Quack with a Poll

- **Given** a logged-in user is composing a new quack,
- **When** they choose to add a poll,
- **Then** they can define between 2 and 10 answer options (each non-empty, trimmed text).
- **And** the quack text itself serves as the question for the poll.
- **And** a quack cannot be submitted with a poll having fewer than 2 non-empty options.

### AC2: Displaying Polls in the Feed

- **Given** a quack contains a poll,
- **When** it renders in the quack feed,
- **Then** all answer options are displayed clearly alongside their respective vote counts and percentage of total votes.
- **And** the total vote count for the poll is displayed.
- **And** if the logged-in user has voted on this poll, their selected option is visibly highlighted.

### AC3: Casting a Vote

- **Given** a logged-in user viewing a poll they have not yet voted on,
- **When** they click on an answer option,
- **Then** their vote is recorded for that option,
- **And** the vote count for that option increases by 1,
- **And** the percentages for all options recalculate,
- **And** that option becomes highlighted as their selected choice.

### AC4: Changing a Vote

- **Given** a logged-in user has already voted for Option A,
- **When** they click on Option B on the same poll,
- **Then** their vote changes from Option A to Option B,
- **And** the vote count for Option A decreases by 1,
- **And** the vote count for Option B increases by 1,
- **And** Option B is now highlighted as their selected choice.

### AC5: Retracting a Vote

- **Given** a logged-in user has already voted for Option A,
- **When** they click on Option A again,
- **Then** their vote is retracted (cleared),
- **And** the vote count for Option A decreases by 1,
- **And** no option is highlighted as selected for the user.

### AC6: Database-Enforced Single Vote

- **Given** concurrent vote submissions or race conditions from the same user on the same poll,
- **When** the votes hit the database,
- **Then** a database-level unique constraint (`userId` + `pollId`) guarantees that a user can never have more than one active vote per poll.

### AC7: Instantaneous Feel & Failure Handling

- **Given** a user interacts with a poll option (voting, changing, or retracting),
- **When** the click occurs,
- **Then** the UI updates optimistically immediately.
- **And** if the network request fails or the server rejects the vote:
  - The UI rolls back to the previous vote state.
  - An error toast alert is displayed informing the user that the vote could not be saved.

### AC8: Author Participation

- **Given** the author of a quack that contains a poll,
- **When** viewing their own post,
- **Then** they can vote, change, or retract their vote on the poll just like any other user.

---

## Out of Scope

- Editing poll questions or option texts after publication.
- Closing or setting expiration timers/deadlines on polls.
- Multiple-choice voting (selecting more than one option simultaneously).
- Viewing the list/avatars of specific users who voted for an option.
- Anonymous voting (all votes belong to authenticated accounts, even if voter identities aren't publicized in the MVP UI).
- Standalone polls without a quack.
