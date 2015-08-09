abbreviate = ->
  return (text, len = 10, truncation = '...') ->
    count = 0
    str = ''
    for i in [0..text.length-1]
      n = escape(text.charAt(i))
      if n.length < 4 then count++ else count += 2
      if (count>len) then return str + truncation
      str += text.charAt(i)
    return text

app.filter 'abbreviate', abbreviate
module.exports = abbreviate
