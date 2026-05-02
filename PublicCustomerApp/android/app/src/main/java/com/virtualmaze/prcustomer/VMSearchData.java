package com.virtualmaze.prcustomer;

import com.dot.nenativemap.LngLat;
import com.virtualmaze.prcustomer.AutocompleteResultType;

public class VMSearchData {
    private String name;
    private String address;
    private String countryCode;
    private AutocompleteResultType type;
    private LngLat lngLat;
    private String line;
    private String parking;
    private String area_hl;
    private double distance;

    public VMSearchData() {

    }

    public VMSearchData(String name, String address, String countryCode, AutocompleteResultType type, LngLat lngLat,
            String line, String parking, String area_hl) {
        this.name = name;
        this.address = address;
        this.countryCode = countryCode;
        this.type = type;
        this.lngLat = lngLat;
        this.line = line;
        this.parking = parking;
        this.area_hl = area_hl;

    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCountyCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public AutocompleteResultType getType() {
        return type;
    }

    public void setType(AutocompleteResultType type) {
        this.type = type;
    }

    public LngLat getLngLat() {
        return lngLat;
    }

    public void setLngLat(LngLat lngLat) {
        this.lngLat = lngLat;
    }

    public String getLine() {
        return line;
    }

    public void setLine(String line) {
        this.line = line;
    }

    public String getParking() {
        return parking;
    }

    public void setParking(String parking) {
        this.parking = parking;
    }

    public String getArea_hl() {
        return area_hl;
    }

    public void setArea_hl(String area_hl) {
        this.area_hl = area_hl;
    }

    public double getDistance() {
        return distance;
    }

    public void setDistance(double distance) {
        this.distance = distance;
    }
}
