# Security Specification for DayEase Firebase Integration

## 1. Data Invariants
- Each user owns exclusively their root document `/users/{userId}` and all subcollections under `/users/{userId}/*`.
- Cross-user data reading, modification, or deletion is strictly forbidden.
- Anonymous / unauthenticated reads or writes are strictly rejected.
- Document IDs must conform to alphanumeric characters and dashes (`^[a-zA-Z0-9_\\-]+$`).
- All created records must specify `userId` strictly matching `request.auth.uid`.
- Immortality rule: `userId` cannot be modified once set.

## 2. The "Dirty Dozen" Threat Vectors
1. Unauthenticated reading of `/users/{userId}/tasks/{taskId}` -> DENY
2. User A attempting to read User B's `/users/userB/tasks/{taskId}` -> DENY
3. User A attempting to create a task in User B's subcollection -> DENY
4. User A creating a task under their own collection with `userId: "userB"` -> DENY
5. User updating a task trying to change `userId` to someone else -> DENY
6. Malicious payload injecting oversized strings (>300 chars for title) -> DENY
7. Malicious payload injecting arbitrary keys or ghost fields into Task -> DENY
8. User attempting to delete another user's class or assignment -> DENY
9. User attempting to read another user's profile or settings -> DENY
10. Unauthenticated listing of any user collection -> DENY
11. Document ID poisoning with special characters or directory traversal -> DENY
12. Attempting to bypass path check with spoofed auth -> DENY
