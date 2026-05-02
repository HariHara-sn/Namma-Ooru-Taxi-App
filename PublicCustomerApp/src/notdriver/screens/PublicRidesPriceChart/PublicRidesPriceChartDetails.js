import { ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import useDriverStatusStore from '../../store/useDriverStatusStore';
import { useStackScreenStore } from '../../../common/store/useStackScreenStore';
import UseBackButton from '../../../common/hooks/UseBackButton';
import NavBar from '../../../common/components/NavBar';
import { Colors, Fonts } from '../../../common/constants/constants';
import { scale } from '../../../common/utils/scalingutils';
import { tableScroll } from '../../styles/TableStyles';


const PublicRidesPriceChartDetails = () => {
    const {selectedFare} = useDriverStatusStore();
    const {goBack} = useStackScreenStore();

    const onBackPress = () => {
      goBack();
    }

    const [query, setQuery] = useState('');

    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const formatMin = (v) => {
      if (v === '' || v === null || typeof v === 'undefined') return '0';
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(2) : String(v);
    };

    const formatMax = (v) => {
      if (v === null) return 'N/A';
      if (v === '' || typeof v === 'undefined') return 'N/A';
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(2) : String(v);
    };

    const baseList = useMemo(
      () => (Array.isArray(selectedFare?.rangePricing) ? selectedFare.rangePricing : []),
      [selectedFare]
    );

    const [filteredPricing, setFilteredPricing] = useState(baseList);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
      // reset results when base list changes
      setFilteredPricing(baseList);
      setIsSearching(false);
    }, [baseList]);

    useEffect(() => {
      setIsSearching(true);
      const handle = setTimeout(() => {
        const q = (query || '').trim();
        if (!q) {
          setFilteredPricing(baseList);
          setIsSearching(false);
          return;
        }
        const qNum = Number(q);
        const isNumeric = Number.isFinite(qNum);
        const lowerQ = q.toLowerCase();
        const next = baseList.filter((r) => {
          const minN = toNum(r?.minDistance);
          const maxN = r?.maxDistance === null ? Infinity : toNum(r?.maxDistance);
          const minDisp = formatMin(r?.minDistance);
          const maxDisp = formatMax(r?.maxDistance);
          if (isNumeric && minN !== null) {
            if (qNum >= minN && qNum <= (maxN ?? minN)) return true;
          }
          return (
            String(minDisp).toLowerCase().includes(lowerQ) ||
            String(maxDisp).toLowerCase().includes(lowerQ)
          );
        });
        setFilteredPricing(next);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(handle);
    }, [query, baseList]);

    const Highlighted = ({ text, queryText }) => {
      const t = String(text ?? '');
      const q = (queryText || '').trim();
      if (!q) return <Text style={tableScroll.colTxt1}>{t}</Text>;
      const idx = t.toLowerCase().indexOf(q.toLowerCase());
      if (idx === -1) return <Text style={tableScroll.colTxt1}>{t}</Text>;
      const before = t.slice(0, idx);
      const match = t.slice(idx, idx + q.length);
      const after = t.slice(idx + q.length);
      return (
        <Text style={tableScroll.colTxt1}>
          {before}
          <Text style={styles.highlight}>{match}</Text>
          {after}
        </Text>
      );
    };

   return (
     <View style={styles.screenContainer}>
         <UseBackButton onBackPress={()=>onBackPress()}/>
         <NavBar title={"Price Chart"} onBackPress={()=>onBackPress()}/>
            <Text style={styles.title}>{selectedFare?.vehicle?.replace("_", " ")}</Text>
            <Text style={styles.timeTitle}>From {selectedFare?.fromTime} to {selectedFare?.toTime}</Text>
            <View style={styles.searchContainer}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search kilometers (e.g., 10.5)"
                placeholderTextColor={'#9CA3AF'}
                keyboardType="decimal-pad"
                style={styles.searchInput}
              />
              {isSearching && (
                <View style={styles.searchSpinnerWrap}>
                  <ActivityIndicator size="small" color={Colors.primary || '#2563EB'} />
                </View>
              )}
            </View>
            <ScrollView>
                <ScrollView
              horizontal
              contentContainerStyle={{
                alignItems: 'center',
                justifyContent: 'center',
                flexGrow: 1,
              }}
              >
              <View style={tableScroll.tableContainer}>
                <View style={tableScroll.tableHeader}>
                  <Text style={tableScroll.header1}>{'From'} (Km)</Text>
                  <Text style={tableScroll.header1}>{'To'} (Km)</Text>
                  <Text style={tableScroll.header1}>(₹) {'Price'}</Text>
                </View>
                {filteredPricing?.map((price, index) => {
                  return (
                    <View key={index} style={tableScroll.columns}>
                      <Highlighted text={`${formatMin(price?.minDistance)} Km`} queryText={query} />
                      <Highlighted text={`${formatMax(price?.maxDistance)} Km`} queryText={query} />
                        <Text style={tableScroll.colTxt1}>
                        ₹ {price?.value ? price.value.toFixed(2) : 'N/A'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
             </ScrollView>
             
     </View>
   );
 };
 
 export default PublicRidesPriceChartDetails;
 
 const styles = StyleSheet.create({
   screenContainer: {
     flex: 1,
     backgroundColor: Colors.white,
   },
   title:{
    fontFamily:Fonts.medium,
    textAlign:'center',
    fontSize:18,
     },
     searchContainer: {
      marginTop: 8,
      marginHorizontal: scale(12),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: '#E1E4E8',
      borderRadius: 8,
      backgroundColor: Colors.white,
      shadowColor: '#000',
      elevation: 2,
     },
     searchInput: {
      paddingHorizontal: scale(12),
      paddingVertical: scale(10),
      fontSize: 14,
      color: Colors.black,
      fontFamily: Fonts.regular,
     },
     highlight: {
      backgroundColor: '#FEF3C7',
      color: '#111827',
      fontFamily: Fonts.semi_bold,
     },
     timeTitle:{
        fontFamily:Fonts.regular,
        textAlign:'center',
        fontSize:14,
        color:'#6B7280',
        marginTop:4
     }
 });