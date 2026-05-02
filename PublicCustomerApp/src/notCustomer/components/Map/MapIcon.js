import { Linking, StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import Logo from '../../assets/image/CompanyLogo.svg'
import { Fonts, mapcopyrightURL, webPortalURL } from '../../constants/constants'

const MapIcon = () => {
  return (
    <View style={styles.container}>
        <TouchableOpacity onPress={() => Linking.openURL(webPortalURL)}>
     <Logo width={60} height={20} />
     </TouchableOpacity>
     <Text style={[styles.text,{color:'blue'}]} onPress={() => Linking.openURL(mapcopyrightURL)}>{' '}© OpenStreetMap</Text>
     <Text style={styles.text}>{' '}contributions</Text>
    </View>
  )
}

export default MapIcon

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    color: '#000',
    fontFamily: Fonts.regular,
  },
})