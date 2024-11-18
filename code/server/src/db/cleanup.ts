"use strict"

import db from "../db/db";

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

export function cleanup() {
  return new Promise<void>((resolve, reject) => {
    db.run("DELETE FROM review", (err: any, _: any) => {
      if (err) return reject();
      db.run("DELETE FROM productInCart", (err: any, _: any) => {
        if (err) return reject();
        db.run("DELETE FROM cart", (err: any, _: any) => {
          if (err) return reject();
          db.run("DELETE FROM product", (err: any, _: any) => {
            if (err) return reject();
            db.run("DELETE FROM users", (err: any, _: any) => {
              if (err) return reject();
              resolve();
            });
          });
        });
      });
    });
  });
}