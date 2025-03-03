# Merge Strategy for Removing Audio Functionality

This document outlines the strategy for merging the `remove-audio-part-for-now` branch into `main`.

## Files to Keep from `remove-audio-part-for-now` Branch

1. **Database Types (`src/lib/database/types.ts`)**

   - Keep the updated Episode interface without the `audio_file_path` field

2. **Database Functions (`src/lib/database/postgres.ts`)**

   - Keep the updated functions that don't include audio functionality
   - Keep the type casting from main (`as Podcast[]`, etc.)
   - Keep the transaction handling and error handling
   - Keep the UUID generation for transcript chunks
   - Keep the migration function

3. **API Routes**

   - Keep the updated episode routes without audio functionality
   - For `src/app/api/audio/[id]/route.ts`, decide whether to:
     - Remove it completely (if audio functionality is being removed entirely)
     - Keep it but update it to work without the `audio_file_path` field

4. **Admin Page (`src/app/admin/page.tsx`)**

   - Keep the updated interface without the audio field
   - Keep the updated form state without the audio field
   - Remove the audio file path input field

5. **Configuration (`src/lib/config.ts`)**

   - Keep the new configuration structure

6. **Migration Scripts**
   - Keep all the new migration scripts
   - Update the package.json to include these scripts with the `--transpile-only` flag

## Merge Process

1. **Resolve Conflicts in Key Files**

   - `src/lib/database/postgres.ts` - DONE
   - `package.json` - DONE
   - `src/lib/database/types.ts` - DONE
   - `src/app/admin/page.tsx` - DONE
   - `src/app/api/episodes/route.ts` - DONE
   - `src/app/api/episodes/[id]/route.ts` - DONE

2. **Handle New Files**

   - `scripts/migrate.ts` - Keep
   - `scripts/migrate-direct.ts` - Keep
   - `scripts/tsconfig.json` - Keep

3. **Handle Removed Files**

   - `src/app/api/audio/[id]/route.ts` - Remove if audio functionality is being removed entirely

4. **Final Steps**
   - Run the migration script on your local database to verify it works
   - Test the application to ensure it functions correctly without audio functionality
   - Commit all resolved files
   - Push to your branch
   - Create a pull request to merge into main

## After Merging

1. **Update Remote Servers**

   - Deploy the updated code
   - Run the migration script to remove the `audio_file_path` column from the database
   - Restart the application

2. **Documentation**
   - Update any documentation to reflect the removal of audio functionality
   - Inform team members about the changes
