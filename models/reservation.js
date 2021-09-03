/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** getting/setting
   *
   * The set syntax binds an object property to a function to be called when there is an attempt to set that property.
   
    *setter function that will error if number of guests is less than 1
   *underscore will connect it to this.numGuests
  only called when error is thrown 
  */
  set numGuests(value) {
    if (value < 1) throw new Error("Can't have less than 1 guest!");
    this._numGuests = value;
  }
  get numGuests() {
    return this._numGuests;
  }

  set startAt(value) {
    if (value instanceof Date && !isNaN(value)) {
      return (this._startAt = value);
    } else {
      throw new Error("Not a valid starting date.");
    }
  }
  get startAt() {
    return this._startAt;
  }

  // if someone tries to assign a falsey value to a customer’s notes, the value instead gets assigned to an empty string.
  set notes(value) {
    this._notes = value || "";
  }
  get notes() {
    return this._notes;
  }

  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
      [customerId]
    );

    return results.rows.map((row) => new Reservation(row));
  }

  async save() {
    // adds a new customer if they’re not found in database
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
          VALUES ($1, $2, $3, $4)
          RETURNING id`,
        [this.customerId, this.numGuests, this.startAt, this.notes]
      );

      this.id = result.rows[0].id;
    } else {
      // updates the existing record if there are changes
      await db.query(
        `UPDATE reservations
          SET num_guests=$1, start_at=$2, notes=$3`,
        [this.numGuests, this.startAt, this.notes]
      );
    }
  }
}

module.exports = Reservation;
