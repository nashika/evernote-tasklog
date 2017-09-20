import {LocaleMessageObject} from "vue-i18n";

let message: LocaleMessageObject = {
  common: {
    action: "action",
    activity: "activity",
    arrival: "arrival",
    attendance: "attendance",
    constraint: "constraint",
    day: "day",
    delete: "delete",
    departure: "departure",
    month: "month",
    note: "note",
    notebook: "notebook",
    person: "person",
    remarks: "remarks",
    repetition: "repetition",
    rest: "rest",
    timeline: "timeline",
    title: "title",
    total: "total",
    update: "update",
    updated: "updated",
    year: "year",
  },
  verb: {
    create: "create {0}"
  },
  push: {
    constraint: {
      body: "There are notes that violated constraints.",
      title: "Constraint (Evernote Tasklog)",
    },
    update: {
      body: "Note was updated, check activity.",
      title: "Updated (Evernote Tasklog)",
    },
  },

};
export default message;
