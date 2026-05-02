package com.virtualmaze.prcustomer;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.util.Log;

import org.json.JSONObject;
import org.json.JSONArray;

import java.util.Map;
import java.util.List;

public class AsyncStorageReader {

    private static final String TAG = "AsyncStorageReader";

    public static String readValueFromAsyncStorage(Context context, String key) {
        String value = null;
        try {
            // Get the path to the AsyncStorage database
            String dbPath = context.getDatabasePath("RKStorage").getPath();

            // Open the database
            SQLiteDatabase db = SQLiteDatabase.openDatabase(dbPath, null, SQLiteDatabase.OPEN_READONLY);

            // Query the database to find the key
            Cursor cursor = db.rawQuery("SELECT value FROM catalystLocalStorage WHERE key= ?", new String[]{key});

            // If a result is found, get the value
            if (cursor.moveToFirst()) {
                value = cursor.getString(0);  // 0 is the column index for the value
            }

            cursor.close();
            db.close();
        } catch (Exception e) {
            Log.e(TAG, "Error reading from AsyncStorage SQLite database", e);
        }
        return value;
    }

    public static void writeValueToAsyncStorage(Context context, String key, String value) {
        try {
            String dbPath = context.getDatabasePath("RKStorage").getPath();
            SQLiteDatabase db = SQLiteDatabase.openDatabase(dbPath, null, SQLiteDatabase.OPEN_READWRITE);

            ContentValues contentValues = new ContentValues();
            contentValues.put("key", key);
            contentValues.put("value", value);

            // Try to update first, if not present then insert
            int rows = db.update("catalystLocalStorage", contentValues, "key= ?", new String[]{key});
            if (rows == 0) {
                db.insert("catalystLocalStorage", null, contentValues);
            }

            db.close();
        } catch (Exception e) {
            Log.e(TAG, "Error writing to AsyncStorage SQLite database", e);
        }
    }

    public static void removeValueFromAsyncStorage(Context context, String key) {
        try {
            String dbPath = context.getDatabasePath("RKStorage").getPath();
            SQLiteDatabase db = SQLiteDatabase.openDatabase(dbPath, null, SQLiteDatabase.OPEN_READWRITE);
            db.delete("catalystLocalStorage", "key= ?", new String[]{key});
            db.close();
        } catch (Exception e) {
            Log.e(TAG, "Error removing key from AsyncStorage SQLite database", e);
        }
    }

    // Convenience: write a Map as a JSON string
    public static void writeValueToAsyncStorage(Context context, String key, Map<String, Object> map) {
        try {
            JSONObject json = new JSONObject(map);
            writeValueToAsyncStorage(context, key, json.toString());
        } catch (Exception e) {
            Log.e(TAG, "Error serializing map to JSON for AsyncStorage", e);
        }
    }

    // Convenience: write a List as a JSON array string
    public static void writeValueToAsyncStorage(Context context, String key, List<?> list) {
        try {
            JSONArray jsonArray = new JSONArray(list);
            writeValueToAsyncStorage(context, key, jsonArray.toString());
        } catch (Exception e) {
            Log.e(TAG, "Error serializing list to JSON for AsyncStorage", e);
        }
    }

    
    public static JSONArray readArrayFromAsyncStorage(Context context, String key) {
        try {
            String value = readValueFromAsyncStorage(context, key);
            if (value == null) {
                return null;
            }
            return new JSONArray(value);
        } catch (Exception e) {
            Log.e(TAG, "Error parsing JSON array from AsyncStorage", e);
            return null;
        }
    }




}
