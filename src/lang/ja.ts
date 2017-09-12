import {LocaleMessageObject} from "vue-i18n";

let message: LocaleMessageObject = {
  common: {
    action: "機能",
    activity: "活動",
    arrival: "出社",
    attendance: "勤怠",
    constraint: "制約",
    day: "日",
    delete: "削除",
    departure: "退社",
    month: "月",
    note: "ノート",
    notebook: "ノートブック",
    person: "担当者",
    remarks: "備考",
    rest: "休憩",
    timeline: "時系列",
    title: "表題",
    total: "合計",
    update: "更新",
    updated: "更新日",
    year: "年",
  },
  push: {
    constraint: {
      body: "制約に違反したノートがあります、制約のページを確認してください。",
      title: "制約違反ノートがあります (Evernote Tasklog)",
    },
    update: {
      body: "ノートが更新されました、活動のページを確認してください。",
      title: "更新しました (Evernote Tasklog)",
    },
  },
};
export default message;
