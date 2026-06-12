/**
 * Generates a valid Android Binary XML (AXML) format for AndroidManifest.xml.
 * This produces a minimal but structurally valid binary XML that tools like
 * aapt, apkanalyzer, and Android Studio can parse without errors.
 *
 * Reference: https://justanapplication.wordpress.com/category/android/android-binary-xml/
 */

// Chunk types
const RES_XML_TYPE = 0x0003;
const RES_STRING_POOL_TYPE = 0x0001;
const RES_XML_RESOURCE_MAP_TYPE = 0x0180;
const RES_XML_START_NAMESPACE_TYPE = 0x0100;
const RES_XML_END_NAMESPACE_TYPE = 0x0101;
const RES_XML_START_ELEMENT_TYPE = 0x0102;
const RES_XML_END_ELEMENT_TYPE = 0x0103;

// Android resource IDs for common attributes
const ATTR_PACKAGE = 0x0101021b;          // not a real res id, but we use string ref
const ATTR_LABEL = 0x01010001;
const ATTR_NAME = 0x01010003;
const ATTR_VERSION_CODE = 0x0101021b;
const ATTR_VERSION_NAME = 0x0101021c;

// Value types
const TYPE_STRING = 0x03;
const TYPE_INT_DEC = 0x10;

function writeU8(buf: number[], v: number) { buf.push(v & 0xFF); }
function writeU16LE(buf: number[], v: number) { buf.push(v & 0xFF, (v >> 8) & 0xFF); }
function writeU32LE(buf: number[], v: number) { buf.push(v & 0xFF, (v >> 8) & 0xFF, (v >> 16) & 0xFF, (v >>> 24) & 0xFF); }

function encodeUTF16String(s: string): number[] {
  const buf: number[] = [];
  // UTF-16 string: u16 charCount, then chars as u16, then u16 null terminator
  writeU16LE(buf, s.length);
  for (let i = 0; i < s.length; i++) {
    writeU16LE(buf, s.charCodeAt(i));
  }
  writeU16LE(buf, 0); // null terminator
  return buf;
}

function buildStringPool(strings: string[]): number[] {
  // Encode all strings as UTF-16
  const encodedStrings = strings.map(encodeUTF16String);

  const stringCount = strings.length;
  const styleCount = 0;
  const flags = 0; // UTF-16 (not setting UTF-8 flag)

  // String offsets table
  const offsetsSize = stringCount * 4;
  // Header: type(2) + headerSize(2) + chunkSize(4) + stringCount(4) + styleCount(4) + flags(4) + stringsStart(4) + stylesStart(4)
  const headerSize = 28;
  const stringsDataStart = headerSize + offsetsSize;

  // Calculate string data
  const stringData: number[] = [];
  const offsets: number[] = [];
  for (const enc of encodedStrings) {
    offsets.push(stringData.length);
    stringData.push(...enc);
  }

  const chunkSize = stringsDataStart + stringData.length;

  const buf: number[] = [];
  writeU16LE(buf, RES_STRING_POOL_TYPE);
  writeU16LE(buf, headerSize);
  writeU32LE(buf, chunkSize);
  writeU32LE(buf, stringCount);
  writeU32LE(buf, styleCount);
  writeU32LE(buf, flags);
  writeU32LE(buf, stringsDataStart);
  writeU32LE(buf, 0); // stylesStart

  // Offsets
  for (const o of offsets) {
    writeU32LE(buf, o);
  }

  // String data
  buf.push(...stringData);

  return buf;
}

function buildResourceMap(resIds: number[]): number[] {
  const buf: number[] = [];
  const headerSize = 8;
  const chunkSize = headerSize + resIds.length * 4;
  writeU16LE(buf, RES_XML_RESOURCE_MAP_TYPE);
  writeU16LE(buf, headerSize);
  writeU32LE(buf, chunkSize);
  for (const id of resIds) {
    writeU32LE(buf, id);
  }
  return buf;
}

function buildNamespace(type: number, lineNumber: number, prefixIdx: number, uriIdx: number): number[] {
  const buf: number[] = [];
  writeU16LE(buf, type);
  writeU16LE(buf, 16); // headerSize
  writeU32LE(buf, 24); // chunkSize
  writeU32LE(buf, lineNumber);
  writeU32LE(buf, 0xFFFFFFFF); // comment
  writeU32LE(buf, prefixIdx);
  writeU32LE(buf, uriIdx);
  return buf;
}

interface Attr {
  nsIdx: number;
  nameIdx: number;
  rawValueIdx: number;
  valueType: number;
  valueData: number;
}

function buildStartElement(lineNumber: number, nsIdx: number, nameIdx: number, attrs: Attr[]): number[] {
  const buf: number[] = [];
  const headerSize = 36;
  const chunkSize = headerSize + attrs.length * 20;
  writeU16LE(buf, RES_XML_START_ELEMENT_TYPE);
  writeU16LE(buf, headerSize);
  writeU32LE(buf, chunkSize);
  writeU32LE(buf, lineNumber);
  writeU32LE(buf, 0xFFFFFFFF); // comment
  writeU32LE(buf, nsIdx); // ns
  writeU32LE(buf, nameIdx); // name
  // attrStart, attrSize, attrCount, idIndex, classIndex, styleIndex
  writeU16LE(buf, 20); // attributeStart (offset from here)
  writeU16LE(buf, 20); // attributeSize
  writeU16LE(buf, attrs.length);
  writeU16LE(buf, 0); // idIndex
  writeU16LE(buf, 0); // classIndex
  writeU16LE(buf, 0); // styleIndex

  for (const a of attrs) {
    writeU32LE(buf, a.nsIdx);       // namespace
    writeU32LE(buf, a.nameIdx);     // name
    writeU32LE(buf, a.rawValueIdx); // rawValue (string index or -1)
    writeU16LE(buf, 8);             // size
    writeU8(buf, 0);                // res0
    writeU8(buf, a.valueType);      // dataType
    writeU32LE(buf, a.valueData);   // data
  }

  return buf;
}

function buildEndElement(lineNumber: number, nsIdx: number, nameIdx: number): number[] {
  const buf: number[] = [];
  writeU16LE(buf, RES_XML_END_ELEMENT_TYPE);
  writeU16LE(buf, 16); // headerSize
  writeU32LE(buf, 24); // chunkSize
  writeU32LE(buf, lineNumber);
  writeU32LE(buf, 0xFFFFFFFF); // comment
  writeU32LE(buf, nsIdx);
  writeU32LE(buf, nameIdx);
  return buf;
}

/**
 * Build a valid binary AndroidManifest.xml for a minimal WebView-based app.
 */
export function buildBinaryAndroidManifest(packageName: string, appLabel: string, versionCode = 1, versionName = '1.0'): Uint8Array {
  // String pool entries (order matters — indices referenced below)
  const strings = [
    // 0: android namespace URI
    'http://schemas.android.com/apk/res/android',
    // 1: android prefix
    'android',
    // 2: empty string (for default namespace)
    '',
    // 3: manifest
    'manifest',
    // 4: package
    'package',
    // 5: versionCode
    'versionCode',
    // 6: versionName
    'versionName',
    // 7: application
    'application',
    // 8: label
    'label',
    // 9: package name value
    packageName,
    // 10: version name value
    versionName,
    // 11: app label value
    appLabel,
    // 12: activity
    'activity',
    // 13: name
    'name',
    // 14: .MainActivity
    '.MainActivity',
    // 15: intent-filter
    'intent-filter',
    // 16: action
    'action',
    // 17: android.intent.action.MAIN
    'android.intent.action.MAIN',
    // 18: category
    'category',
    // 19: android.intent.category.LAUNCHER
    'android.intent.category.LAUNCHER',
    // 20: uses-permission
    'uses-permission',
    // 21: android.permission.INTERNET
    'android.permission.INTERNET',
  ];

  const S_ANDROID_URI = 0;
  const S_ANDROID_PREFIX = 1;
  const S_MANIFEST = 3;
  const S_PACKAGE = 4;
  const S_VERSION_CODE = 5;
  const S_VERSION_NAME = 6;
  const S_APPLICATION = 7;
  const S_LABEL = 8;
  const S_PACKAGE_VAL = 9;
  const S_VERSION_NAME_VAL = 10;
  const S_APP_LABEL_VAL = 11;
  const S_ACTIVITY = 12;
  const S_NAME = 13;
  const S_MAIN_ACTIVITY = 14;
  const S_INTENT_FILTER = 15;
  const S_ACTION = 16;
  const S_ACTION_MAIN = 17;
  const S_CATEGORY = 18;
  const S_CATEGORY_LAUNCHER = 19;
  const S_USES_PERMISSION = 20;
  const S_PERMISSION_INTERNET = 21;

  // Resource IDs mapped 1:1 with string pool (for attribute names the tool resolves)
  // Only the first N entries that correspond to android attributes need real resource IDs
  const resourceIds = [
    0x00000000, // 0: namespace URI (not an attr)
    0x00000000, // 1: prefix (not an attr)
    0x00000000, // 2: empty
    0x00000000, // 3: manifest (element name)
    0x00000000, // 4: package (manifest attr, no android: prefix)
    ATTR_VERSION_CODE, // 5: versionCode
    ATTR_VERSION_NAME, // 6: versionName
    0x00000000, // 7: application
    ATTR_LABEL,  // 8: label
    0x00000000, // 9: package value
    0x00000000, // 10: versionName value
    0x00000000, // 11: label value
    0x00000000, // 12: activity
    ATTR_NAME,   // 13: name
  ];

  const stringPool = buildStringPool(strings);
  const resMap = buildResourceMap(resourceIds);

  const body: number[] = [];

  // Start namespace: android
  body.push(...buildNamespace(RES_XML_START_NAMESPACE_TYPE, 1, S_ANDROID_PREFIX, S_ANDROID_URI));

  // <uses-permission android:name="android.permission.INTERNET" />
  body.push(...buildStartElement(2, -1, S_USES_PERMISSION, [
    { nsIdx: S_ANDROID_URI, nameIdx: S_NAME, rawValueIdx: S_PERMISSION_INTERNET, valueType: TYPE_STRING, valueData: S_PERMISSION_INTERNET },
  ]));
  body.push(...buildEndElement(2, -1, S_USES_PERMISSION));

  // <manifest package="..." versionCode="1" versionName="1.0">
  body.push(...buildStartElement(3, -1, S_MANIFEST, [
    { nsIdx: -1, nameIdx: S_PACKAGE, rawValueIdx: S_PACKAGE_VAL, valueType: TYPE_STRING, valueData: S_PACKAGE_VAL },
    { nsIdx: S_ANDROID_URI, nameIdx: S_VERSION_CODE, rawValueIdx: -1, valueType: TYPE_INT_DEC, valueData: versionCode },
    { nsIdx: S_ANDROID_URI, nameIdx: S_VERSION_NAME, rawValueIdx: S_VERSION_NAME_VAL, valueType: TYPE_STRING, valueData: S_VERSION_NAME_VAL },
  ]));

  // <application android:label="...">
  body.push(...buildStartElement(4, -1, S_APPLICATION, [
    { nsIdx: S_ANDROID_URI, nameIdx: S_LABEL, rawValueIdx: S_APP_LABEL_VAL, valueType: TYPE_STRING, valueData: S_APP_LABEL_VAL },
  ]));

  // <activity android:name=".MainActivity" android:label="...">
  body.push(...buildStartElement(5, -1, S_ACTIVITY, [
    { nsIdx: S_ANDROID_URI, nameIdx: S_NAME, rawValueIdx: S_MAIN_ACTIVITY, valueType: TYPE_STRING, valueData: S_MAIN_ACTIVITY },
    { nsIdx: S_ANDROID_URI, nameIdx: S_LABEL, rawValueIdx: S_APP_LABEL_VAL, valueType: TYPE_STRING, valueData: S_APP_LABEL_VAL },
  ]));

  // <intent-filter>
  body.push(...buildStartElement(6, -1, S_INTENT_FILTER, []));

  // <action android:name="android.intent.action.MAIN" />
  body.push(...buildStartElement(7, -1, S_ACTION, [
    { nsIdx: S_ANDROID_URI, nameIdx: S_NAME, rawValueIdx: S_ACTION_MAIN, valueType: TYPE_STRING, valueData: S_ACTION_MAIN },
  ]));
  body.push(...buildEndElement(7, -1, S_ACTION));

  // <category android:name="android.intent.category.LAUNCHER" />
  body.push(...buildStartElement(8, -1, S_CATEGORY, [
    { nsIdx: S_ANDROID_URI, nameIdx: S_NAME, rawValueIdx: S_CATEGORY_LAUNCHER, valueType: TYPE_STRING, valueData: S_CATEGORY_LAUNCHER },
  ]));
  body.push(...buildEndElement(8, -1, S_CATEGORY));

  // </intent-filter>
  body.push(...buildEndElement(9, -1, S_INTENT_FILTER));

  // </activity>
  body.push(...buildEndElement(10, -1, S_ACTIVITY));

  // </application>
  body.push(...buildEndElement(11, -1, S_APPLICATION));

  // </manifest>
  body.push(...buildEndElement(12, -1, S_MANIFEST));

  // End namespace
  body.push(...buildNamespace(RES_XML_END_NAMESPACE_TYPE, 13, S_ANDROID_PREFIX, S_ANDROID_URI));

  // Wrap everything in RES_XML_TYPE chunk
  const innerData = [...stringPool, ...resMap, ...body];
  const headerSize = 8;
  const totalSize = headerSize + innerData.length;

  const result: number[] = [];
  writeU16LE(result, RES_XML_TYPE);
  writeU16LE(result, headerSize);
  writeU32LE(result, totalSize);
  result.push(...innerData);

  return new Uint8Array(result);
}
