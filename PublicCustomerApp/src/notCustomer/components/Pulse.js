import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { View, Text, Image, StyleSheet } from 'react-native';

const Pulse = ({
  color,
  diameter,
  duration,
  image,
  initialDiameter,
  numPulses,
  pulseStyle,
  speed,
  style,
}) => {
  const [pulses, setPulses] = useState([]);
  const [started, setStarted] = useState(false);
  const maxDiameter = diameter;

  useEffect(() => {
    setStarted(true);
    let mounted = true;
    let createPulseTimers = [];
    let pulseInterval;

    // Create pulses
    for (let a = 0; a < numPulses; a++) {
      const timer = setTimeout(() => {
        if (mounted) {
          createPulse(a);
        }
      }, a * duration);
      createPulseTimers.push(timer);
    }

    // Update pulses
    pulseInterval = setInterval(() => {
      if (mounted) {
        updatePulse();
      }
    }, speed);

    return () => {
      mounted = false;
      createPulseTimers.forEach(clearTimeout);
      clearInterval(pulseInterval);
    };
  }, [numPulses, duration, speed]);

  const createPulse = (pKey) => {
    setPulses((prevPulses) => {
      const newPulse = {
        pulseKey: prevPulses.length + 1,
        diameter: initialDiameter,
        opacity: 0.5,
        centerOffset: (maxDiameter - initialDiameter) / 2,
      };
      return [...prevPulses, newPulse];
    });
  };

  const updatePulse = () => {
    setPulses((prevPulses) =>
      prevPulses.map((pulse, i) => {
        const newDiameter = pulse.diameter > maxDiameter ? 0 : pulse.diameter + 2;
        const centerOffset = (maxDiameter - newDiameter) / 2;
        const opacity = Math.abs(newDiameter / maxDiameter - 1);
        return {
          pulseKey: i + 1,
          diameter: newDiameter,
          opacity: opacity > 0.5 ? 0.5 : opacity,
          centerOffset: centerOffset,
        };
      })
    );
  };

  const containerStyle = [styles.container, style];
  const pulseWrapperStyle = { width: maxDiameter, height: maxDiameter };

  return (
    <View style={containerStyle}>
      {started && (
        <View style={pulseWrapperStyle}>
          {pulses.map((pulse) => (
            <View
              key={pulse.pulseKey}
              style={[
                styles.pulse,
                {
                  backgroundColor: color,
                  width: pulse.diameter,
                  height: pulse.diameter,
                  opacity: pulse.opacity,
                  borderRadius: pulse.diameter / 2,
                  top: pulse.centerOffset,
                  left: pulse.centerOffset,
                },
                pulseStyle,
              ]}
            />
          ))}
          {image && <Image style={image.style} source={image.source} />}
        </View>
      )}
    </View>
  );
};

Pulse.propTypes = {
  color: PropTypes.string,
  diameter: PropTypes.number,
  duration: PropTypes.number,
  image: PropTypes.object,
  initialDiameter: PropTypes.number,
  numPulses: PropTypes.number,
  pulseStyle: PropTypes.object,
  speed: PropTypes.number,
  style: PropTypes.object,
};

Pulse.defaultProps = {
  color: 'blue',
  diameter: 400,
  duration: 1000,
  image: null,
  initialDiameter: 0,
  numPulses: 3,
  pulseStyle: {},
  speed: 10,
  style: {
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
    flex: 1,
  },
});

export default Pulse;
