import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Animated } from "react-native";
import { AppLoading, Linking, Notifications } from "expo";
import * as Contacts from "expo-contacts";
import * as SecureStore from "expo-secure-store";
import { Button } from "react-native-elements";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useFonts } from "@use-expo/font";

const _MS_PER_DAY = 1000 * 60 * 60 * 24;

// a and b are javascript Date objects
function dateDiffInDays(a: Date, b: Date) {
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

export default function App() {
  const [currentContact, setCurrentContact] = useState();
  const [bottomAreaSelected, setBottomAreaSelected] = useState(false);
  const [getInTouchY] = useState(new Animated.Value(0));
  const [bottomAreaY] = useState(new Animated.Value(0));
  const [showActionButtons, setShowActionButtons] = useState(false);

  const animateGetInTouch = () => {
    Animated.timing(getInTouchY, { toValue: 1, duration: 200 }).start(() => {
      setShowActionButtons(true);
      Animated.timing(getInTouchY, { toValue: 0, duration: 100 }).start();
    });
  };

  const animateBottomArea = () => {
    Animated.timing(bottomAreaY, { toValue: 1, duration: 200 }).start(() => {
      setBottomAreaSelected(true);
      Animated.timing(bottomAreaY, { toValue: 0, duration: 100 }).start();
    });
  };

  let [fontsLoaded] = useFonts({
    Roshida: require("./assets/font/Roshida-Valentines.ttf"),
  });

  useEffect(() => {
    (async () => {
      const currentContactJson = await SecureStore.getItemAsync(
        "currentContact"
      );
      if (currentContactJson) {
        const _currentContact = JSON.parse(currentContactJson);
        const dateDiff = dateDiffInDays(
          new Date(),
          new Date(_currentContact.timestamp)
        );
        if (dateDiff === 0) {
          setCurrentContact(_currentContact.contact);
          return;
        }
      }
      getNewContact();
      var tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8);
      Notifications.scheduleLocalNotificationAsync(
        {
          title: "Just a friendly reminder to write a friend!",
          body: "Click to see who you will write today.",
        },
        { time: tomorrow, repeat: "day" }
      );
    })();
  }, []);

  async function addCurrentToBlacklist() {
    const blacklistedJson = await SecureStore.getItemAsync("blacklisted");
    let blacklisted: any[];
    if (blacklistedJson) {
      blacklisted = JSON.parse(blacklistedJson);
    } else {
      blacklisted = [];
    }
    blacklisted.push(currentContact.id);
    await SecureStore.setItemAsync("blacklisted", JSON.stringify(blacklisted));
  }

  async function getNewContact() {
    setShowActionButtons(false);
    setBottomAreaSelected(false);
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      let { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.PHONE_NUMBERS,
          Contacts.Fields.Emails,
          Contacts.IMAGE,
        ],
      });
      const blacklisted = await SecureStore.getItemAsync("blacklisted");
      if (blacklisted) {
        data = data.filter((contact) => !blacklisted.includes(contact.id));
      }
      const r = Math.floor(Math.random() * data.length);
      SecureStore.setItemAsync(
        "currentContact",
        JSON.stringify({ contact: data[r], timestamp: new Date() })
      );
      setCurrentContact(data[r]);
    }
  }

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friendly Reminder</Text>
      </View>
      {currentContact && (
        <View style={styles.card}>
          <Text style={styles.name}>{currentContact.name}</Text>
          <View
            style={{
              borderColor: "#228888",
              borderWidth: 5,
              borderRadius: 40,
              padding: 10,
              backgroundColor: "#e7fafa",
              overflow: "hidden",
              width: 400,
              height: 90,
            }}
          >
            <Animated.View
              style={{
                transform: [
                  {
                    translateY: getInTouchY.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 100],
                    }),
                  },
                ],
              }}
            >
              {showActionButtons ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: 6,
                    marginHorizontal: 10,
                  }}
                >
                  {currentContact.phoneNumbers && (
                    <Button
                      buttonStyle={styles.button}
                      icon={
                        <MaterialIcons
                          style={styles.buttonIcon}
                          name="phone"
                          color="white"
                        />
                      }
                      onPress={() =>
                        Linking.openURL(
                          `tel:${currentContact.phoneNumbers[0].number}`
                        )
                      }
                    ></Button>
                  )}
                  {currentContact.phoneNumbers && (
                    <Button
                      buttonStyle={styles.button}
                      icon={
                        <MaterialIcons
                          style={styles.buttonIcon}
                          name="sms"
                          color="white"
                        />
                      }
                      onPress={() =>
                        Linking.openURL(
                          `sms:${currentContact.phoneNumbers[0].number}`
                        )
                      }
                    ></Button>
                  )}
                  {currentContact.email && (
                    <Button
                      buttonStyle={styles.button}
                      icon={
                        <MaterialIcons
                          style={styles.buttonIcon}
                          name="email"
                          color="white"
                        />
                      }
                      onPress={() =>
                        Linking.openURL(`mailto:${currentContact.email}`)
                      }
                    ></Button>
                  )}
                  <Button
                    buttonStyle={styles.button}
                    icon={
                      <MaterialIcons
                        style={styles.buttonIcon}
                        name="account-box"
                        color="white"
                      />
                    }
                    onPress={() =>
                      Linking.openURL(
                        `content://com.android.contacts/contacts/${currentContact.id}`
                      )
                    }
                  ></Button>
                </View>
              ) : (
                <Button
                  buttonStyle={{
                    backgroundColor: "#e7fafa",
                  }}
                  titleStyle={styles.contactButtonText}
                  title={`Bei ${currentContact.name.split(" ")[0]} melden.`}
                  onPress={animateGetInTouch}
                ></Button>
              )}
            </Animated.View>
          </View>
        </View>
      )}
      <Animated.View
        style={{
          flex: 1,
          flexDirection: "row",
          marginBottom: 50,
          justifyContent: "center",
          alignItems: "center",
          transform: [
            {
              translateY: bottomAreaY.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 300],
              }),
            },
          ],
        }}
      >
        {bottomAreaSelected ? (
          <View style={styles.removeButtonContainer}>
            <Button
              buttonStyle={styles.bottomButton}
              titleStyle={styles.skipText}
              title="Heute überspringen"
              onPress={() => getNewContact()}
            ></Button>
            <Button
              buttonStyle={styles.bottomButton}
              titleStyle={styles.removeText}
              title="Nicht mehr vorschlagen"
              onPress={async () => {
                await addCurrentToBlacklist();
                getNewContact();
              }}
            ></Button>
          </View>
        ) : (
          <Text style={styles.dontGetInTouchText} onPress={animateBottomArea}>
            Nicht bei {currentContact && currentContact.name.split(" ")[0]}{" "}
            melden
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e7fafa",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    flex: 6,
    justifyContent: "center",
    alignItems: "center",
    width: 300,
    height: 70,
  },
  buttonIcon: {
    fontSize: 25,
  },
  button: {
    margin: 5,
    backgroundColor: "#228888",
  },
  name: {
    fontSize: 60,
    textAlign: "center",
    fontFamily: "Roshida",
    marginBottom: 50,
    color: "#092121",
    padding: 5,
  },
  bottomButton: {
    backgroundColor: "transparent",
    margin: 5,
  },
  skipText: {
    fontSize: 20,
    fontFamily: "Roshida",
    color: "#d6a95a",
  },
  removeText: {
    fontSize: 20,
    fontFamily: "Roshida",
    color: "#c55164",
  },
  removeButtonContainer: {
    flex: 1,
    marginBottom: 50,
  },
  header: {
    paddingTop: Constants.statusBarHeight,
    backgroundColor: "#228888",
    alignSelf: "stretch",
  },
  headerTitle: {
    color: "#fff",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
    fontSize: 20,
    fontFamily: "Roshida",
  },
  contactButtonText: {
    fontSize: 40,
    color: "#228888",
    fontFamily: "Roshida",
  },
  dontGetInTouchText: {
    fontFamily: "Roshida",
    fontSize: 20,
  },
});
