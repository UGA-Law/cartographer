const imageExtensions = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.ai',
  '.bmp',
  '.ico',
  '.ps',
  '.psd',
  '.svg',
  '.tif',
  '.tiff'
]

const audioExtensions = [
  '.aif',
  '.cda',
  '.mid',
  '.midi',
  '.mp3',
  '.mpa',
  '.ogg',
  '.wav',
  '.wma',
  '.wpl',
  '.aiff'
]

const compressedFiles = [
  '.7z',
  '.arj',
  '.deb',
  '.pkg',
  '.rar',
  '.rpm',
  '.tar.gz',
  '.z',
  '.zip'
]

const internetFiles = [
  '.asp',
  '.aspx',
  '.cer',
  '.cfm',
  '.cgi',
  '.pl',
  '.css',
  // '.htm',
  // '.html',
  '.js',
  '.jsp',
  '.part',
  '.php',
  '.py',
  '.rss'
  // '.xhtml'
]

const presentationFiles = [
  '.key',
  '.odp',
  '.pps',
  '.ppt',
  '.pptx'
]

const programmingFiles = [
  '.c',
  '.class',
  '.cpp',
  '.cs',
  '.h',
  '.java',
  '.sh',
  '.swift',
  '.vb'
]

const spreadsheetFiles = [
  '.ods',
  '.xlr',
  '.xls',
  '.xlsx',
  '.csv',
  '.tsv'
]

const videoFiles = [
  '.3g2',
  '.3gp',
  '.avi',
  '.flv',
  '.h264',
  '.m4v',
  '.mkv',
  '.mov',
  '.mp4',
  '.mpg',
  '.mpeg',
  '.rm',
  '.swf',
  '.vob',
  '.wmv'
]

const wordProcessingFiles = [
  '.doc',
  '.docx',
  '.odt',
  '.pdf',
  '.rtf',
  '.tex',
  '.txt',
  '.md',
  '.wks',
  '.wps',
  '.wpd'
]

const executableFiles = [
  '.apk',
  '.bat',
  '.bin',
  '.cgi',
  '.pl',
  '.exe',
  // '.com',
  '.gadget',
  '.jar',
  '.py',
  '.app',
  '.wsf'
]

const fontFiles = [
  '.fnt',
  '.fon',
  '.otf',
  '.ttf'
]

const databaseFiles = [
  '.csv',
  '.dat',
  '.db',
  '.dbf',
  '.log',
  '.mdb',
  '.sav',
  '.sql',
  '.sav',
  '.sql',
  '.tar',
  '.xml',
  '.json'
]

const diskMediaFiles = [
  '.bin',
  '.dmg',
  '.iso',
  '.toast',
  '.vcd'
]

const otherFiles = [
  '.pl' // perl scripts
]

const restrictedExtensions = [
  ...imageExtensions,
  ...audioExtensions,
  ...compressedFiles,
  ...internetFiles,
  ...presentationFiles,
  ...programmingFiles,
  ...spreadsheetFiles,
  ...videoFiles,
  ...wordProcessingFiles,
  ...executableFiles,
  ...fontFiles,
  ...diskMediaFiles,
  ...databaseFiles,
  ...otherFiles
]

const restrictedExtensionSet = new Set()

for (const extension of restrictedExtensions) {
  if (restrictedExtensionSet.has(extension.toLowerCase()) === false) {
    restrictedExtensionSet.add(extension.toLowerCase())
  }
}

module.exports = {
  restrictedExtensions,
  restrictedExtensionSet
}
