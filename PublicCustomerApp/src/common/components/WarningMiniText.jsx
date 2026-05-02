/* eslint-disable react/react-in-jsx-scope */
import { Text } from "react-native";
import { Fonts } from "../constants/constants";
import { useTranslation } from "react-i18next";


export default function WarningMiniText({text}) {
  const {t} = useTranslation()

  return (
    <Text style={{
        color: '#FFA500',
        fontSize: 12,
        marginTop: 10,
        marginBottom: 10,
        fontFamily: Fonts.light
    }}>{t(text)}</Text>
  )
}