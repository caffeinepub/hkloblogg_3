# HKLOblogg

## Current State
Adminpanelens Användare-flik har blockera/avblockera-knappar men de misslyckas med "User not found" eftersom frontend skickar `alias` (från `UserProfile`) till `blockUser(userId: Text)` som förväntar sig principal-ID. Det finns ingen raderingsknapp för superadmin.

## Requested Changes (Diff)

### Add
- `userId` fält i `UserProfile`-typen i Motoko, `backend.did.js`, och `backend.d.ts`
- `adminDeleteUser(userId: Text)` i Motoko -- tar bort konto, alla inlägg och alla kommentarer av användaren
- `useAdminDeleteUser` mutation hook i `useQueries.ts`
- Raderingsknapp (med bekräftelsedialog) i `UsersTab` i `AdminPage.tsx`, synlig bara för superadmin

### Modify
- `listUsers()` i Motoko returnerar nu `userId` i varje `UserProfile`
- `useBlockUser` i `useQueries.ts` skickar nu `userId` (principal) istället för alias
- `UsersTab` i `AdminPage.tsx` hämtar `userId` från `user.userId` och skickar det till blockera/raderamutationer
- `backend.did.js` -- `UserProfile` IDL inkluderar `userId: IDL.Text`
- `backend.d.ts` -- `UserProfile` interface inkluderar `userId: string`

### Remove
- Inget tas bort

## Implementation Plan
1. Uppdatera Motoko: lägg till `userId` i `UserProfile`, uppdatera `listUsers`, lägg till `adminDeleteUser`
2. Uppdatera `backend.did.js`: `UserProfile` IDL med `userId: IDL.Text`
3. Uppdatera `backend.d.ts`: `UserProfile` interface med `userId: string`
4. Uppdatera `useQueries.ts`: `useAdminDeleteUser` hook, rätta `useBlockUser` att använda userId
5. Uppdatera `AdminPage.tsx`: skicka `user.userId` till blockera-mutation, lägg till raderingsknapp för superadmin
