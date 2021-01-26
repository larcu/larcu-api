function formatDate(date, fmt) {
  function pad(value) {
      return (value.toString().length < 2) ? '0' + value : value;
  }
  return fmt.replace(/%([a-zA-Z])/g, function (_, fmtCode) {
      switch (fmtCode) {
      case 'y':
          return date.getUTCFullYear();
      case 'm':
          return pad(date.getUTCMonth() + 1);
      case 'd':
          return pad(date.getUTCDate());
      case 'h':
          return pad(date.getUTCHours());
      case 'm':
          return pad(date.getUTCMinutes());
      case 's':
          return pad(date.getUTCSeconds());
      default:
          throw new Error('Unsupported format code: ' + fmtCode);
      }
  });
}
module.exports = formatDate;