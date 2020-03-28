const appConfig: appConfig.IAppConfigs = {
  "*": {
    port: 3000,
    logLevel: "trace",
    sandbox: false,
    token: "",
    persons: [
      { id: 1, name: "Alpha" },
      { id: 2, name: "Beta" },
      { id: 3, name: "Gamma" }
    ],
    warningNoteCount: 300,
    workingTimeStart: 9,
    workingTimeEnd: 19,
    defaultFilterParams: {
      timeline: {},
      notes: { stacks: ["StackA", "StackB"], notebooks: ["NotebookA", "NotebookB"] },
      activity: {}
    },
    constraints: [
      {
        id: 1,
        label: "Constraint 1",
        query: {
          notebook: "Notebook1",
          reminderOrder: null
        }
      }
    ]
  },
  development: {
    baseUrl: "http://localhost:3000"
  },
  "production*": {
    logLevel: "info"
  },
  "production-pre": {},
  production: {}
};
export default appConfig;