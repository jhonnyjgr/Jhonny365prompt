# Security Specification for Jhonny Prompt 365

## 1. Data Invariants
- A **User** document can only be created/modified by the authenticated user with the matching UID.
- A **Prompt** can be read by anyone if `isPublic` is true. Private prompts are only accessible by the author.
- VIP Prompts require the user to have the `VIP` or `Admin VIP` role.
- **Conversations** can only be read/written by the two participants (`user1Id` or `user2Id`).
- **Messages** belong to a conversation and inherit visibility from it.

## 2. The "Dirty Dozen" Payloads
- P1: Attempt to create a user profile with a different UID.
- P2: Attempt to update a user's role to `Admin VIP` from the client.
- P3: Attempt to read a private prompt of another user.
- P4: Attempt to delete a prompt owned by someone else.
- P5: Attempt to create a prompt with a spoofed `authorId`.
- P6: Attempt to join a conversation where the user is not `user1Id` or `user2Id`.
- P7: Attempt to send a message to a conversation the user is not part of.
- P8: Attempt to update someone else's message.
- P9: Attempt to increment `copyCount` by 100 in a single update.
- P10: Attempt to inject a massive string (1MB) as a prompt title.
- P11: Attempt to read all user profiles (blanket read).
- P12: Attempt to spoof `createdAt` to a date in the past.

## 3. Test Runner (Draft)
The `firestore.rules.test.ts` would verify these scenarios using the Firebase Emulator Suite.
