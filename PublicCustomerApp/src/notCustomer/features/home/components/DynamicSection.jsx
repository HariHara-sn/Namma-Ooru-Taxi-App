import React, { useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Fonts } from "../../../constants/constants";
import useConfigStore from '../../../store/useConfigStore'; 
import BannerAuto from '../../../assets/image/banners/bannerAuto.webp';   
import BannerStops from '../../../assets/image/banners/bannerStops.webp'; 
import { useTranslation } from "react-i18next";
import BannerFamily from '../../../assets/image/banners/bannerFamily.webp';
import AdaptiveText from "../../../components/Common/AdaptiveText";

const ActingDriverImage = require("../../../../common/assets/images/acting_driver.webp");

/* ------------------------------------------------------------------
   ASSET MAP: Service images keyed by item key
-------------------------------------------------------------------*/
const SERVICE_IMAGES = {
    mygarage: require("../../../assets/vehicle/garage.webp"),
    auto: require("../../../assets/vehicle/AUTO.webp"),
    electric_auto: require("../../../assets/vehicle/ELECTRIC_AUTO.webp"),
    schedule_trip: require("../../../assets/vehicle/SCHDULED.webp"),
    female_driver: require("../../../assets/vehicle/FEMALE_DRIVER.webp"),
    rental_trip: require("../../../assets/vehicle/AUTO.webp"),
    night_trip: require("../../../assets/vehicle/nightRide.webp"),
    default: require("../../../assets/vehicle/AUTO.webp"),
};

const getServiceImage = (serviceKey) => SERVICE_IMAGES[serviceKey] || SERVICE_IMAGES.default;

const DEFAULT_HORIZONTAL_BANNERS = [
    {
        id: "mock-banner-1",
        title: "Early Bird Offer",
        description: "Book before 8 AM and save 15% on your ride.",
        bannerURI: "https://images.pexels.com/photos/210231/pexels-photo-210231.jpeg",
    },
    {
        id: "mock-banner-2",
        title: "Refer & Earn",
        description: "Share Public Rides with friends and earn rewards.",
        bannerURI: "https://images.pexels.com/photos/135061/pexels-photo-135061.jpeg",
    },
    {
        id: "mock-banner-3",
        title: "Weekend Specials",
        description: "Flat 20% off on outstation trips this weekend.",
        bannerURI: "https://images.pexels.com/photos/672358/pexels-photo-672358.jpeg",
    },
];

const createRemoteSource = (uri) => {
    if (typeof uri === "string" && uri.trim().length) {
        return {
            uri,
            cache: "force-cache",
        };
    }
    return null;
};

const getBannerImageSource = (item) => {
    if (!item) {
        return SERVICE_IMAGES.default;
    }
    if (item.image) {
        return item.image;
    }
    if (item?.id == "bannerAuto"){
        return BannerAuto;
    }
    if (item?.id == "bannerStops"){
        return BannerStops;
    }
    if (item?.id == "bannerFamily"){
        return BannerFamily;
    }
    if (item.bannerURI) {
        return createRemoteSource(item.bannerURI) || SERVICE_IMAGES.default;
    }
    if (item.imageUri) {
        return createRemoteSource(item.imageUri) || SERVICE_IMAGES.default;
    }
    if (item.imageUrl) {
        return createRemoteSource(item.imageUrl) || SERVICE_IMAGES.default;
    }
    return SERVICE_IMAGES.default;
};

const formatKm = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value >= 10 ? `${Math.round(value)} km` : `${value.toFixed(1)} km`;
    }
    if (typeof value === "string" && value.trim().length) {
        return value;
    }
    return null;
};

const DEFAULT_HORIZONTAL_TEXT_PLACEMENT = "bottom-left";

const getCandidateLanguageCodes = (language) => {
    if (typeof language !== "string" || !language.trim()) {
        return [];
    }
    const normalized = language.toLowerCase();
    if (normalized.includes("-")) {
        const [base] = normalized.split("-");
        return [normalized, base];
    }
    return [normalized];
};

const getLocalizedValue = (item, field, language) => {
    if (!item || typeof item !== "object") {
        return null;
    }
    const candidates = getCandidateLanguageCodes(language);
    for (let index = 0; index < candidates.length; index += 1) {
        const langCode = candidates[index];
        const localizedKey = `${field}:${langCode}`;
        if (Object.prototype.hasOwnProperty.call(item, localizedKey) && item[localizedKey]) {
            return item[localizedKey];
        }
    }
   
    return item[field] ?? null;
};

const getHorizontalTextPlacement = (section, item) => {
    const placement = item?.textPlacement
        || item?.text?.placement
        || section?.textPlacement
        || DEFAULT_HORIZONTAL_TEXT_PLACEMENT;
    return typeof placement === "string" ? placement.toLowerCase() : DEFAULT_HORIZONTAL_TEXT_PLACEMENT;
};

const getHorizontalGradientProps = (placement) => {
    if (placement === "top-left") {
        return {
            colors: ["rgba(0, 0, 0, 0.63)", "rgba(0,0,0,0)"],
            locations: [0, 1],
            start: { x: 0, y: 0 },
            end: { x: 1, y: 1 },
        };
    }
    if (placement === "top-right") {
        return {
            colors: ["rgba(0, 0, 0, 0.60)", "rgba(0,0,0,0)"],
            locations: [0, 1],
            start: { x: 1, y: 0 },
            end: { x: 0, y: 1 },
        };
    }
    if (placement === "bottom-right") {
        return {
            colors: ["rgba(0,0,0,0)", "rgba(0, 0, 0, 0.60)"],
            locations: [0, 1],
            start: { x: 1, y: 0 },
            end: { x: 0, y: 1 },
        };
    }
    if (placement === "bottom-left") {
        return {
            colors: ["rgba(0,0,0,0)", "rgba(0, 0, 0, 0.60)"],
            locations: [0, 1],
            start: { x: 0, y: 0 },
            end: { x: 1, y: 1 },
        };
    }
    if (placement === "center-left") {
        return {
            colors: ["rgba(0,0,0,0.60)", "rgba(0,0,0,0)"],
            locations: [0, 1],
            start: { x: 0.15, y: 0 },
            end: { x: 1, y: 0 },
        };
    }
    if (placement === "center-right") {
        return {
            colors: ["rgba(0,0,0,0.60)", "rgba(0,0,0,0)"],
            locations: [0, 1],
            start: { x: 0.85, y: 0 },
            end: { x: 0, y: 0 },
        };
    }
    if (placement === "center") {
        return {
            colors: ["rgba(0,0,0,0.6)", "rgba(0,0,0,0.6)"],
            locations: [0, 1],
            start: { x: 0.5, y: 0 },
            end: { x: 0.5, y: 1 },
        };
    }
    return {
        colors: ["rgba(0,0,0,0)", "rgba(0,0,0,0.60)"],
        locations: [0.15, 1],
        start: { x: 0.5, y: 0 },
        end: { x: 0.5, y: 1 },
    };
};

const getHorizontalOverlayAlignment = (placement) => {
    if (placement === "center") {
        return { justifyContent: "center", alignItems: "center" };
    }
    if (placement.startsWith("top")) {
        return { alignItems: "flex-start" };
    }
    if (placement.startsWith("center")) {
        return { alignItems: "center" };
    }
    return null;
};

const getHorizontalTextContainerAlignment = (placement = DEFAULT_HORIZONTAL_TEXT_PLACEMENT) => {
    if (!placement || typeof placement !== "string") {
        return null;
    }

    const normalized = placement.toLowerCase();

    switch (normalized) {
    case "top-left":
        return { alignItems: "flex-start", justifyContent: "flex-start" };
    case "top-right":
        return { alignItems: "flex-end", justifyContent: "flex-start" };
    case "bottom-left":
        return { alignItems: "flex-start", justifyContent: "flex-end" };
    case "bottom-right":
        return { alignItems: "flex-end", justifyContent: "flex-end" };
    case "center-left":
        return { alignItems: "flex-start", justifyContent: "center" };
    case "center-right":
        return { alignItems: "flex-end", justifyContent: "right" };
    case "center":
        return { alignItems: "center", justifyContent: "center" };
    default:
        return null;
    }
};

const getHorizontalTextAlignment = (placement = DEFAULT_HORIZONTAL_TEXT_PLACEMENT) => {
    if (!placement || typeof placement !== "string") {
        return null;
    }

    const normalized = placement.toLowerCase();

    switch (normalized) {
    case "top-right":
    case "bottom-right":
    case "center-right":
        return styles.horizontalTextRight;
    case "center":
        return styles.horizontalTextCenter;
    default:
        return null;
    }
};

/* ------------------------------------------------------------------
   CONFIG: Per-item colors for LIGHT THEME
-------------------------------------------------------------------*/

// const SECTION_CONFIG = [
    
//     {
//         key: "services",
//         sectionTitle: "Choose Your Ride",
//         showSectionTitle: false,
//         items: [
//             {
//                 key: "auto",
//                 label: "Auto",
//                 bgColor: "#f3f3f3ff",         // light yellow
//                 textColor: "#858585ff",
//                 borderColor: "#ffffffff",
//             },
//             {
//                 key: "electric_auto",
//                 label: "Electric Auto",
//                 bgColor: "#f3f3f3ff",         // light yellow
//                 textColor: "#858585ff",
//                 borderColor: "#ffffffff",
//             },
//             {
//                 key: "schedule_trip",
//                 label: "Schedule",
//                 bgColor: "#f3f3f3ff",         // light yellow
//                 textColor: "#858585ff",
//                 borderColor: "#ffffffff",
//             },
//             // {
//             //     key: "rental_trip",
//             //     label: "Rental Trip",
//             //     bgColor: "#f3f3f3ff",         // light yellow
//             //     textColor: "#333333",
//             //     borderColor: "#ffffffff",
//             // },
//             {
//                 key: "female_driver",
//                 label: "Female Driver",
//                 bgColor: "#f3f3f3ff",         // light yellow
//                  textColor: "#858585ff",
//                 borderColor: "#ffffffff",
//             },
//         ],
//     },
//     {
//         key:"offers_banner",
//         sectionTitle:"Offers",
//         showSectionTitle:true,
//         bannerURI:'https://img.freepik.com/free-photo/abstract-smooth-dark-blue-with-black-vignette-studio-well-use-as-backgroundbusiness-reportdigitalwebsite-templatebackdrop_1258-108878.jpg?semt=ais_se_enriched&w=740&q=80',  
//         text:{
//             title:"Special Offer",
//             description:"Get 20% off on your first ride!",
//             placement:"top-right",
//             needOverlay:true,
//         },
//         offerCouponCode: "FIRST20",
//     },
//     {
//         sectionTitle:"NearBy Events",
//         showSectionTitle:true,
//         key:"local_events",
//         bannerURI:'https://img.freepik.com/free-photo/abstract-smooth-dark-blue-with-black-vignette-studio-well-use-as-backgroundbusiness-reportdigitalwebsite-templatebackdrop_1258-108878.jpg?semt=ais_se_enriched&w=740&q=80',
//         text:{
//             title:"Discover Local Events",
//             description:"Explore events happening around you with Public Rides.",
//             placement:"bottom-left",
//             needOverlay:true,
//         },
//         coords: { latitude: 37.7749, longitude: -122.4194 },
//     }
   
  
// ];

/* ------------------------------------------------------------------
   COMPONENT
-------------------------------------------------------------------*/
const DynamicSection = ({ title = "Dynamic Section", onSelect = () => {} }) => {
    const { appConfig } = useConfigStore();
    const { i18n, t } = useTranslation();
    const rawSectionConfig = Array.isArray(appConfig?.HOME_SCREEN_CONFIG)
        ? appConfig.HOME_SCREEN_CONFIG
        : [];
    const shouldInjectHorizontal = !rawSectionConfig.some((section) => section?.key === "horizontal_banners");
    const SECTION_CONFIG = useMemo(
        () => (
            shouldInjectHorizontal
                ? [
                    
                    ...rawSectionConfig,
                ]
                : rawSectionConfig
        ),
        [rawSectionConfig, shouldInjectHorizontal],
    );
    const ENHANCED_SECTION_CONFIG = useMemo(
        () => (
            Array.isArray(SECTION_CONFIG)
                ? SECTION_CONFIG.map((section) => {
                    if (!section) {
                        return section;
                    }
                    const resolvedItems = Array.isArray(section?.items)
                        ? section.items.map((item) => ({
                            original: item,
                            imageSource: getBannerImageSource(item),
                        }))
                        : [];
                    return {
                        ...section,
                        resolvedItems,
                    };
                })
                : []
        ),
        [SECTION_CONFIG],
    );
    const prefetchedBannerUrisRef = useRef(new Set());

    useEffect(() => {
        if (!Array.isArray(ENHANCED_SECTION_CONFIG) || !ENHANCED_SECTION_CONFIG.length) {
            return;
        }

        const alreadyPrefetched = prefetchedBannerUrisRef.current;
        const prefetchPromises = [];

        const enqueuePrefetch = (uri) => {
            if (typeof uri !== "string" || !uri.length || alreadyPrefetched.has(uri)) {
                return;
            }
            alreadyPrefetched.add(uri);
            prefetchPromises.push(
                Image.prefetch(uri).catch(() => {
                    alreadyPrefetched.delete(uri);
                }),
            );
        };

        ENHANCED_SECTION_CONFIG.forEach((section) => {
            if (section?.bannerURI) {
                enqueuePrefetch(section.bannerURI);
            }
            if (Array.isArray(section?.resolvedItems)) {
                section.resolvedItems.forEach((itemWrapper) => {
                    if (itemWrapper?.imageSource && typeof itemWrapper.imageSource.uri === "string") {
                        enqueuePrefetch(itemWrapper.imageSource.uri);
                    }
                });
            }
        });

        if (prefetchPromises.length) {
            Promise.allSettled(prefetchPromises);
        }
    }, [ENHANCED_SECTION_CONFIG]);
    const getPlacementStyle = (placement) => {
        switch (placement) {
        case "top-left":
            return { top: 16, left: 16, alignItems: "flex-start" };
        case "top-right":
            return { top: 16, right: 16, alignItems: "flex-end" };
        case "bottom-right":
            return { bottom: 16, right: 16, alignItems: "flex-end" };
        case "center":
            return { top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" };
        case "bottom-left":
        default:
            return { bottom: 16, left: 16, alignItems: "flex-start" };
        }
    };

    const getTextAlignmentStyle = (placement) => {
        if (!placement) {
            return null;
        }
        if (placement.includes("right")) {
            return styles.bannerTextRight;
        }
        if (placement === "center") {
            return styles.bannerTextCenter;
        }
        return null;
    };

    const handleHorizontalBannerPress = (section, item) => {
   
        item['key'] = item?.id
        onSelect(item);
    };

    const handleHorizontalBannerButtonPress = (section, item) => {
        if (typeof item?.buttonOnPress === "function") {
            item.buttonOnPress(item, section);
            return;
        }
        handleHorizontalBannerPress(section, item);
    };

    const renderHorizontalBannerList = (section) => {
        const isHorizontal = section?.isHorizontal !== undefined ? section.isHorizontal : true;
        const contentPaddingHorizontal = section?.contentPaddingHorizontal ?? 5;
        const gridSpacing = section?.gridSpacing ?? 12;
        const itemSpacing = section?.itemSpacing ?? 12;
        const effectiveData = Array.isArray(section?.resolvedItems) && section.resolvedItems.length
            ? section.resolvedItems
            : [];

        const renderItem = ({ item }) => {
            const bannerData = item?.original || item;
            const distanceLabel = formatKm(bannerData?.distanceKm ?? bannerData?.distance);
            const textPlacement = getHorizontalTextPlacement(section, bannerData);
            const gradientProps = getHorizontalGradientProps(textPlacement);
            const overlayAlignment = getHorizontalOverlayAlignment(textPlacement);
            const textContainerAlignment = getHorizontalTextContainerAlignment(textPlacement);
            const horizontalTextAlignment = getHorizontalTextAlignment(textPlacement);
            const imageSource = item?.imageSource || getBannerImageSource(bannerData);
            const localizedTitle = getLocalizedValue(bannerData, "title", i18n.language);
            const localizedDescription = getLocalizedValue(bannerData, "description", i18n.language);
            const localizedButtonText = getLocalizedValue(bannerData, "buttonText", i18n.language);
            const titleValue = typeof (localizedTitle || bannerData?.name) === "string"
                ? (localizedTitle || bannerData.name)
                : "";
            const isShortTitle = titleValue.length > 0 && titleValue.length <= 30;
            const cardWidth = Number.isFinite(section?.itemWidth) ? section.itemWidth : 280;
            const titleWidthStyle = titleValue
                ? { maxWidth: Math.round(cardWidth * (isShortTitle ? 0.5 : 0.6)) }
                : null;

            return (
                <TouchableOpacity
                    style={[
                        styles.horizontalCard,
                        { width: section?.itemWidth || 280 },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleHorizontalBannerPress(section, bannerData)}
                >
                    <Image
                        source={imageSource}
                        style={styles.horizontalImage}
                        resizeMode="cover"
                        progressiveRenderingEnabled
                    />
                    {(localizedTitle || localizedDescription || bannerData?.name || bannerData?.area || distanceLabel) ? (
                        <LinearGradient
                            {...gradientProps}
                            style={[styles.horizontalCardOverlay, overlayAlignment]}
                        >
                            <View style={[styles.horizontalCardTextContainer, textContainerAlignment]}>
                                {(localizedTitle || bannerData?.name) ? (
                                    <AdaptiveText
                                        style={[styles.horizontalCardTitle, horizontalTextAlignment, titleWidthStyle]}
                                       
                                    >
                                        {localizedTitle || bannerData.name}
                                    </AdaptiveText>
                                ) : null}
                                {(localizedDescription || bannerData?.area) ? (
                                    <AdaptiveText
                                        style={[styles.horizontalCardDescription, horizontalTextAlignment]}
                                    >
                                        {localizedDescription || bannerData.area}
                                    </AdaptiveText>
                                ) : null}
                                {localizedButtonText ? (
                                    <TouchableOpacity
                                        style={styles.horizontalCardButton}
                                        activeOpacity={0.85}
                                        onPress={() => handleHorizontalBannerButtonPress(section, bannerData)}
                                    >
                                        <AdaptiveText style={styles.horizontalCardButtonText}>{localizedButtonText}</AdaptiveText>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                            {distanceLabel ? (
                                <View style={styles.horizontalCardDistanceChip}>
                                    <AdaptiveText style={styles.horizontalCardDistanceText}>{distanceLabel}</AdaptiveText>
                                </View>
                            ) : null}
                        </LinearGradient>
                    ) : null}
                </TouchableOpacity>
            );
        };

        const localizedSectionTitle = getLocalizedValue(section, "sectionTitle", i18n.language)
            || getLocalizedValue(section, "title", i18n.language);
        return (
            <View key={section.key} style={styles.horizontalSection}>
                {(section.showSectionTitle !== false) && (localizedSectionTitle || section.sectionTitle || section.title) ? (
                    <AdaptiveText style={styles.title}>{localizedSectionTitle || section.sectionTitle || section.title}</AdaptiveText>
                ) : null}
                <FlatList
                    data={effectiveData}
                    keyExtractor={(item, index) => item?.original?.id || item?.original?.key || `${section.key}-${index}`}
                    renderItem={renderItem}
                    horizontal={isHorizontal}
                    nestedScrollEnabled={isHorizontal}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal: contentPaddingHorizontal,
                        paddingVertical: isHorizontal ? 0 : 8,
                    }}
                    ItemSeparatorComponent={
                        isHorizontal
                            ? () => <View style={{ width: itemSpacing }} />
                            : () => <View style={{ height: gridSpacing }} />
                    }
                    numColumns={isHorizontal ? 1 : (section?.numColumns || 2)}
                    columnWrapperStyle={
                        isHorizontal
                            ? undefined
                            : {
                                paddingRight: Math.max(contentPaddingHorizontal - gridSpacing, 0),
                            }
                    }
                    initialNumToRender={section?.initialNumToRender || 6}
                    windowSize={section?.windowSize || 8}
                    key={isHorizontal ? "h" : "v"}
                />
            </View>
        );
    };

    const renderServices = (section) => (
        <View key={section.key} style={styles.section}>
            {(() => {
                const localizedSectionTitle = getLocalizedValue(section, "sectionTitle", i18n.language)
                    || getLocalizedValue(section, "title", i18n.language);
                return (section.showSectionTitle !== false)
                    ? (<Text style={styles.title}>{localizedSectionTitle || section.sectionTitle || title}</Text>)
                    : null;
            })()}
            <FlatList
                data={section.items}
                keyExtractor={(item) => item.key}
                numColumns={4}
                scrollEnabled={false}
                columnWrapperStyle={styles.columnWrapper}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.card,
                            
                        ]}
                        activeOpacity={0.8}
                        onPress={() => onSelect(item)}
                    >
                        <View style={[
                            {
                                backgroundColor:   "#f3f3f3ff",
                                // borderColor: item.borderColor || "#eee",
                                // backgroundColor: "#f0e5ffff",
                                paddingHorizontal: 5,
                                paddingTop: 5,
                                borderRadius: 8,
                            },
                        ]}>
                            <Image source={getServiceImage(item.key)} style={styles.image} resizeMode="contain" />
                        </View>
                        
                        <Text style={[styles.label, { color: item.textColor || "#353535ff" }]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    const handleBannerPress = (section) => {
        if (typeof section.onPress === "function") {
            section.onPress(section);
            return;
        }
        if (section.coords) {
            onSelect({ key: section.key, coords: section.coords });
            return;
        }
        onSelect({ key: section.key });
    };

    const renderBanner = (section) => (
        section?.bannerURI ? (
            <View key={section.key} style={styles.bannerSection}>
                {(() => {
                    const localizedSectionTitle = getLocalizedValue(section, "sectionTitle", i18n.language)
                        || getLocalizedValue(section, "title", i18n.language);
                    return (section.showSectionTitle !== false) && (localizedSectionTitle || section.sectionTitle || section.title)
                        ? (<Text style={styles.title}>{localizedSectionTitle || section.sectionTitle || section.title}</Text>)
                        : null;
                })()}
                <TouchableOpacity style={styles.bannerContainer} activeOpacity={0.85} onPress={() => handleBannerPress(section)}>
                    <Image
                        source={createRemoteSource(section.bannerURI) || SERVICE_IMAGES.default}
                        style={[
                            styles.bannerImage,
                            {
                                height: section.bannerHeight || 140,
                                width: "100%",
                            },
                        ]}
                        resizeMode="cover"
                    />
                    {section.text ? (
                        <View
                            style={[
                                styles.bannerTextWrapper,
                                getPlacementStyle(section.text.placement),
                                section.text.needOverlay ? { backgroundColor: "rgba(0, 0, 0, 0.55)" } : { backgroundColor: "transparent" },
                            ]}
                        >
                            {section.text.title ? (
                                <Text style={[styles.bannerTitle, getTextAlignmentStyle(section.text.placement)]}>
                                    {section.text.title}
                                </Text>
                            ) : null}
                            {section.text.description ? (
                                <Text style={[styles.bannerDescription, getTextAlignmentStyle(section.text.placement)]}>
                                    {section.text.description}
                                </Text>
                            ) : null}
                            {section.offerCouponCode ? (
                                <Text style={[styles.bannerCoupon, getTextAlignmentStyle(section.text.placement)]}>
                                    {`Use code: ${section.offerCouponCode}`}
                                </Text>
                            ) : null}
                        </View>
                    ) : null}
                </TouchableOpacity>
            </View>
        ) : null
    );

    const renderersByKey = {
        services: renderServices,
        horizontal_banners: renderHorizontalBannerList,
        offers_banner: renderBanner,
        local_events: renderBanner,
    };

    const renderActingDriverBanner = () => (
        appConfig.actingDriverEnabled ? (
            <TouchableOpacity
                style={styles.actingDriverBanner}
                activeOpacity={0.85}
                onPress={() => onSelect({ key: "acting_driver" })}
            >
                <LinearGradient
                    colors={["#9B2423", "#6B1A19"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actingDriverGradient}
                >
                     <Image
                        source={ActingDriverImage}
                        style={styles.actingDriverImage}
                        resizeMode="contain"
                    />
                    <View style={styles.actingDriverTextContainer}>
                        <Text style={styles.actingDriverTitle}>
                            {t("hire_acting_driver", "Hire an Acting Driver")}
                        </Text>
                        <Text style={styles.actingDriverSubtitle}>
                            {t("hire_acting_driver_desc", "Need a driver? Book a verified driver for your vehicle")}
                        </Text>
                        <View style={styles.actingDriverCta}>
                            <Text style={styles.actingDriverCtaText}>
                                {t("book_now", "Book Now")}
                            </Text>
                        </View>
                    </View>
                   
                </LinearGradient>
            </TouchableOpacity>
        ) : null
    );

    return (
        <View>
            {ENHANCED_SECTION_CONFIG.map((section) => {
                const renderer = renderersByKey[section.key];
                if (!renderer) {
                    return null;
                }
                return (
                    <React.Fragment key={section.key}>
                        {renderer(section)}
                        {section.key === "services" && renderActingDriverBanner()}
                    </React.Fragment>
                );
            })}
        </View>
    );
};

/* ------------------------------------------------------------------
   STYLES
-------------------------------------------------------------------*/
const styles = StyleSheet.create({
    section: {
       
    },
    bannerSection: {
        marginVertical: 5,
    },
    title: {
        marginBottom: 12,
        marginLeft: 10,
        fontSize: 18,
        fontFamily: Fonts.medium,
        color: "#969696ff",
    },
    columnWrapper: {
        justifyContent: "flex-start",
    },
    card: {
        flexBasis: "23%",
        flexGrow: 0,
        marginHorizontal: 4,
        paddingHorizontal: 8,
        paddingVertical: 12,
       
        alignItems: "center",
    },
    image: {
        width: 64,
        height: 64,
        marginBottom: 8,
    },
    label: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        textAlign: "center",
        marginTop: 4,
    },
    bannerContainer: {
        marginVertical: 10,
        paddingHorizontal: 12,
    },
    bannerImage: {
        height: 140,
        borderRadius: 8,
    },
    bannerTextWrapper: {
        marginHorizontal: 10,
        position: "absolute",
        maxWidth: "70%",
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
    },
    bannerTitle: {
        fontSize: 18,
        fontFamily: Fonts.medium,
        color: "#ffffff",
        marginBottom: 4,
    },
    bannerDescription: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: "#f4f4f4",
    },
    bannerCoupon: {
        marginTop: 6,
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: "#ffe27a",
        letterSpacing: 0.5,
    },
    bannerTextRight: {
        textAlign: "right",
    },
    bannerTextCenter: {
        textAlign: "center",
    },
    horizontalSection: {
        marginVertical: 5,
    },
    horizontalCard: {
        borderRadius: 12,
        overflow: "hidden",
    },
    horizontalImage: {
        width: "100%",
        height: 160,
    },
    horizontalCardOverlay: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    horizontalCardTextContainer: {
        flex: 1,
        flexShrink: 1,
        maxWidth: "100%",
    },
    horizontalCardTitle: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: "#ffffff",
      
    },
    horizontalCardDescription: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: "#f5f5f5",
        marginTop: 4,
        width: "70%",
    },
    horizontalCardButton: {
        marginTop: 12,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.8)",
    },
    horizontalCardButtonText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: "#1f1f1f",
        letterSpacing: 0.3,
    },
    horizontalTextRight: {
        textAlign: "right",
    },
    horizontalTextCenter: {
        textAlign: "center",
    },
    horizontalCardDistanceChip: {
        marginLeft: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    horizontalCardDistanceText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: "#ffffff",
        letterSpacing: 0.3,
    },
    actingDriverBanner: {
        marginHorizontal: 12,
        marginVertical: 10,
        borderRadius: 12,
        overflow: "hidden",
    },
    actingDriverGradient: {
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 20,
        paddingVertical: 18,
        minHeight: 130,
    },
    actingDriverTextContainer: {
        flex: 1,
        justifyContent: "center",
    },
    actingDriverTitle: {
        fontSize: 20,
        fontFamily: Fonts.medium,
        color: "#ffffff",
        lineHeight: 26,
    },
    actingDriverSubtitle: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: "#EAF2FF",
        marginTop: 4,
        lineHeight: 17,
    },
    actingDriverCta: {
        marginTop: 12,
        backgroundColor: "#ffffff",
        alignSelf: "flex-start",
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
    },
    actingDriverCtaText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: "#9B2423",
    },
    actingDriverImage: {
        width: 110,
        height: 100,
        marginRight: 10,
    },
});

/* ------------------------------------------------------------------
   PROP TYPES
-------------------------------------------------------------------*/
DynamicSection.propTypes = {
    title: PropTypes.string,
    onSelect: PropTypes.func,
};

export default DynamicSection;
