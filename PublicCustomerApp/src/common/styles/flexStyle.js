import {StyleSheet} from 'react-native';

export const flexStyle = StyleSheet.create({

  acjc: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  acjsb: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  frjsb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  frjsa: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  frjse: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },

  fr: {
    flexDirection: 'row',
  },
  frg5: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  frg10: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  ac: {
    alignItems: 'center',
  },
  jc: {
    justifyContent: 'center',
  },
  fw: {
    flexWrap: 'wrap',
  },
  g5: {
    gap: 5,
  },
  g10: {
    gap:10
  }
});

export const lines = StyleSheet.create({
  dotted: {
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    marginVertical: 7,
    borderColor: '#9e9e9e',
  },
  plainLine: {
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e0e0e0',
    // marginVertical: 10,
  },
});

