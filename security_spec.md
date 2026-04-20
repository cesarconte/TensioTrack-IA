# TensioTrack Security Specification

## Data Invariants
1. **User Ownership**: Every piece of data (Readings, AI Reports) must belong to a specific user. Access is strictly partitioned by `userId`.
2. **Clinical Integrity (AMPA)**:
    - Readings must have valid ranges: Systolic (40-300), Diastolic (30-200), Heart Rate (30-250).
    - Readings must have an order (1-3) and a slot (morning/evening).
    - Readings must have a valid ISO date string.
3. **Immutability**:
    - `userUid` and `userId` fields are immutable after creation.
    - `createdAt` timestamps are immutable and must match server time.
4. **Relational Consistency**:
    - Sub-collections (readings, ai_reports) must belong to an existing user document.
5. **Authorization**:
    - Users can only read/write their own data.
    - Admins (identified by verified email or role) can read all data.
    - Writes require verified email (per clinical app guidelines).

## The "Dirty Dozen" Payloads (Denial Tests)

1. **Identity Spoofing**: Attempt to create a reading with a `userUid` that doesn't match `request.auth.uid`.
2. **Cross-User Access**: Authenticated User A tries to read `users/UserB/readings/123`.
3. **Invalid Ranges**: Create a reading with `systolic: 500` or `diastolic: 10`.
4. **Missing Required Fields**: Create a reading without the `date` or `slot` field.
5. **Shadow Field Injection**: Update a user profile adding an `isAdmin: true` field.
6. **Immutable Field Tampering**: Update a reading attempting to change its `recordedAt` timestamp.
7. **Bypass Protocol**: Attempt to set `order: 5` in a session reading.
8. **Unverified User Write**: Attempt to write data with an unverified email (assuming verified email mandate).
9. **Junk ID Injection**: Using a 2KB string as a reading ID.
10. **State Corruption**: Updating an AI report's `dataQuality` to `150`.
11. **Orphaned Record**: Creating a reading for a user ID that doesn't have a profile document.
12. **Recursive Cost Attack**: Listing readings without a proper `userUid` filter or as an unauthenticated user.

## The Test Runner (firestore.rules.test.ts)
(Planned implementation for verification)
