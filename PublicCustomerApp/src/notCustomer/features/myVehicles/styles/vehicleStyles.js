import { StyleSheet } from 'react-native';
import { colors, Fonts } from '../../../constants/constants';

const vehicleStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // ─── Empty / loading state ───────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: colors.black,
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.grey_xxdark,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  listContent: {
    paddingBottom: 100,
  },
  // ─── Vehicle card ────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grey_xxlight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0EFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardRegNo: {
    fontFamily: Fonts.semi_bold,
    fontSize: 15,
    color: colors.black,
  },
  cardMeta: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: colors.grey_xxdark,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardActionBtn: {
    padding: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: colors.green,
  },
  // ─── Add vehicle button ──────────────────────────────────────────────────
  addVehicleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.black,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  addVehicleBtnText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: colors.white,
  },
  // ─── Form ────────────────────────────────────────────────────────────────
  formContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  formTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: colors.black,
    marginBottom: 6,
  },
  formSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: colors.grey_xxdark,
    marginBottom: 20,
  },
  failedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF8ED',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  failedBannerText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: colors.orange,
  },
  inputLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: colors.grey_xxdark,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.grey_light,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.black,
    marginBottom: 16,
    backgroundColor: colors.white,
  },
  inputDisabled: {
    backgroundColor: colors.grey_xxlight,
    color: colors.grey_xxdark,
  },
  inputMultiline: {
    height: 80,
    paddingTop: 10,
  },
  // ─── Chip row ────────────────────────────────────────────────────────────
  typeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.grey_light,
    backgroundColor: colors.white,
  },
  typeChipSelected: {
    borderColor: colors.black,
    backgroundColor: '#F0EFFF',
  },
  typeChipText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: colors.black,
  },
  typeChipTextSelected: {
    color: colors.black,
  },
  // ─── Form action row ─────────────────────────────────────────────────────
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.grey_light,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 15,
    color: colors.black,
  },
  addBtn: {
    flex: 1,
    backgroundColor: colors.black,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnDisabled: {
    backgroundColor: colors.grey_dark,
  },
  addBtnText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 15,
    color: colors.white,
  },
  // ─── Picker trigger ──────────────────────────────────────────────────────
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerTriggerText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.black,
    flex: 1,
  },
  pickerTriggerPlaceholder: {
    color: colors.grey_dark,
  },
  // ─── Picker modal sheet ──────────────────────────────────────────────────
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingTop: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey_light,
  },
  pickerTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: colors.black,
  },
  pickerCloseBtn: {
    padding: 4,
  },
  pickerSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.grey_xxlight,
    borderRadius: 10,
  },
  pickerSearchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.black,
    padding: 0,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey_xxlight,
  },
  pickerItemText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: colors.black,
  },
});

export default vehicleStyles;


