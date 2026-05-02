import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { toggleHeaderStyle } from '../styles/ToggleHeaderStyle';
import AdaptiveText from './Common/AdaptiveText';
const ToggleHeader = ({ options, callback }) => {

    const [Options, setOptions] = useState(options);

    const [ActiveOption, setActiveOption] = useState(Options[0]?.id);

    const HandleHeaderClick = async (id) => {
        setActiveOption(id);
        await callback(id);
    }


    return (
        <View style={toggleHeaderStyle.container}>
            <View style={toggleHeaderStyle.containerItems}>
                {
                    Options.map((item, index) => (
                        <TouchableOpacity
                            key={`header-option-${index}`}
                            style={[toggleHeaderStyle.containerItem, ActiveOption === item.id ? toggleHeaderStyle.containerItemActive : {}]}
                            onPress={() => HandleHeaderClick(item.id)}
                        >
                            <AdaptiveText
                                color={ActiveOption === item.id ? 'white' : 'black'}
                                style={[toggleHeaderStyle.containerItemLabel, ActiveOption === item.id ? toggleHeaderStyle.containerItemActiveLabel : {}]}
                            >{item.title}</AdaptiveText>
                        </TouchableOpacity>
                    ))
                }
            </View>
        </View>
    )
}

export default ToggleHeader;