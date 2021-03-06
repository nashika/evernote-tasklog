import Vue from "vue";

export function abbreviateFilter(
  text: string,
  len: number = 10,
  truncation: string = "..."
) {
  let count = 0;
  let str = "";
  for (let i = 0; i < text.length; i++) {
    const n = encodeURI(text.charAt(i));
    if (n.length < 4) count++;
    else count += 2;
    if (count > len) return str + truncation;
    str += text.charAt(i);
  }
  return text;
}

Vue.filter("abbreviate", abbreviateFilter);
