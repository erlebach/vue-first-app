// import { map } from "core-js/core/array";
import * as u from "./utils.js";

export function computeFeeders(bookings) {
  // Run through bookings, and for each ID, collect the feeders and the outbounds
  // u.print("enter computeFeeders");

  // const fsu_m = u.createMapping(fsu, "id"); // orig code

  // attribute: incoming flight id
  // Given id_f, generate all the outgoing flights,
  // or equivalently, the bookings that connect outgoing flights to the feeder id_f.
  // bookings_out[id_f]: list of id_f's outgoing flights
  // bookings_in[id_nf]: list of id_nf's feeders
  // Each list should not have id duplicates

  // bookings.forEach((r) => {
  //   r.id = r.id_f + "-" + r.id_nf;
  // });

  // Given id_f, generate a list all the outgoing flight IDs,
  const bookingIds_out = u.createMappingOneToManyAttr(
    bookings,
    "id_f",
    "id_nf"
  );

  // Given id_nf, generate a list of all the incoming flight IDs,
  const bookingIds_in = u.createMappingOneToManyAttr(bookings, "id_nf", "id_f");
  u.print("computeFeeders::bookingIds_in", bookingIds_in);
  u.print("computeFeeders::bookingIds_out", bookingIds_out);

  return {
    bookingIds_in,
    bookingIds_out,
  };
}
