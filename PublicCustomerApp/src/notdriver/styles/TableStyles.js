import { StyleSheet } from 'react-native';
import { Colors, colors, Fonts } from '../../common/constants/constants';
import { scale } from '../../common/utils/scalingutils';


export const TableStyles = StyleSheet.create({
  table: {
    backgroundColor: Colors.black,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cell: {
    padding: 8,
    // justifyContent: 'center',
    // alignItems: 'center',
    flexDirection: 'row',
    // backgroundColor:'blue',
    width: '25%'
  },
  headerCell: {
    backgroundColor: Colors.black,
  },
  headerTxt: {
    color: Colors.white,
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  cellrow: {
    backgroundColor: Colors.white,
    width: '100%',
    borderColor: 'rgba(0,0,0,0.1)',
    borderWidth: 1
  },
  contentTxt: {
    color: Colors.black,
    fontFamily: Fonts.light,
    fontSize: 12,
    width: '25%',
    alignItems: 'center'
  },
});

export const tableScroll = StyleSheet.create({
  tableContainer: {
    overflow: 'hidden',
    width: '100%',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.periwinkle,
  },
  header1: {
    width: scale(140),
    padding: 10,
    color: Colors.white,
    fontFamily: Fonts.regular,
    fontSize: 12,
    backgroundColor: Colors.periwinkle,
    textAlign:"center"

  },
  header2: {
    width: scale(100),
    backgroundColor: Colors.periwinkle,

  },
  header3: {
    padding: 10,
    color: Colors.white,
    fontFamily: Fonts.regular,
    fontSize: 12,
    width: '25%',
    borderColor: 'rgba(0,0,0,0.1)',
    borderWidth: 1
  },
  columns: {
    flexDirection: 'row',
    borderColor: 'rgba(0,0,0,0.1)',
    borderWidth: 1
  },
  colTxt1: {
    width: scale(140),
    padding: 10,
    color: Colors.black,
    fontFamily: Fonts.light,
    flexDirection: 'row',
    borderRightColor: 'rgba(0,0,0,0.1)',
    borderRightWidth: 1,
    fontSize: 12,
    textAlign:"center"
  },
  colTxt2: {
    width: scale(100),
    flexDirection: 'row',
    borderRightColor: 'rgba(0,0,0,0.1)',
    borderRightWidth: 1,
  },
});

