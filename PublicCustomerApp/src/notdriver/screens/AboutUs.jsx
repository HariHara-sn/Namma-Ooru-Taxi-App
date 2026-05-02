import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import { settingStyle } from '../styles/SettingsStyles'


const AboutUs = () => {
    return (
        <ScrollView style={{ flex: 1, padding: 10,marginBottom:100 }}>
            <View style={{padding:5,rowGap:5}}>
            <Text style={settingStyle.jstfy}>VirtualMaze is engaged in the art of developing maps based software solutions. With expertise in real time graphics rendering, web/smartphone apps development, cloud solutions and many cutting edge technologies, we cater to the needs of various top clients across the globe. Being one of the popular software development companies in India, we aspire to build smart and innovative software solutions for smartphones. With a well-experienced team by our side, we aim to provide distinctive tech services including GPS tracking & functionality tools, software development and exciting gaming applications. Our domain expertise in Information Technology enables us to develop creative, exciting and user-friendly mobile apps that transform to a whole new level of user-experience.</Text>
            </View>
            <Text style={settingStyle.title}>Vision</Text>
            <View style={{padding:5,rowGap:5}}>
                <Text style={settingStyle.jstfy}>To be a pioneer in User Interface (UI) & User Experience (UX) research and development. We strive to bring out the best experience for our users with great usability and functionality.
                </Text>
            </View>
            <Text style={settingStyle.title}>Mission</Text>
            <View style={{padding:5,rowGap:5}}>
                <Text style={settingStyle.jstfy}>To develop innovative software & mobile applications and to become a leader in the gaming industry. We aim to make a difference for all our users with our unique and wide range of technology services.
                </Text>
            </View>
            <Text style={settingStyle.title}>Our Services </Text>
            <View style={{padding:5,rowGap:5,marginBottom:10}}>
                <Text style={settingStyle.jstfy}>VirtualMaze aspires to build smart, innovative and distinctive tech services to ease the life of our users. With a deep understanding in the Information Technology domain, we desire to develop software solutions and applications for smartphones. Our industry experts always keep an eye on the current trends and work towards bringing the advanced technological changes for a better user experience. We offer tailored services to meet your specific requirements as user interaction is of utmost priority to us.
                    Our unique and wide range of technology services include OSM Data Based Maps, GPS Tracking Solutions, Custom Offline Map Navigation, Logistics Optimization, Web Development, Android Development, iOS Development and UI/UX Design.</Text>
            </View>
        </ScrollView>
    )
}

export default AboutUs