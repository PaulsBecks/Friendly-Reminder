import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Image } from "react-native";
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
  let [fontsLoaded] = useFonts({
    "Mako-Regular": require("./assets/font/Mako-Regular.ttf")
  });

  useEffect(() => {
    (async () => {
      const currentContactJson = await SecureStore.getItemAsync(
        "currentContact"
      );
      console.log(currentContact);
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
          body: "Click to see who you will write today."
        },
        { time: tomorrow }
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
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      let { data } = await Contacts.getContactsAsync({
        fields: [Contacts.PHONE_NUMBERS, Contacts.Fields.Emails, Contacts.IMAGE]
      });
      const blacklisted = await SecureStore.getItemAsync("blacklisted");
      if (blacklisted) {
        data = data.filter(contact => !blacklisted.includes(contact.id));
      }
      const r = Math.floor(Math.random() * data.length);
      console.log(data[r]);
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
          {currentContact.imageAvailable ? (
            <Image source={currentContact.image} style={styles.contactImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderImageText}>
                {currentContact.name[0]}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{currentContact.name}</Text>
          <View>
            <View style={styles.buttonContainer}>
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
          </View>
        </View>
      )}
      <View style={styles.removeButtonContainer}>
        <Button
          buttonStyle={styles.skipButton}
          icon={
            <MaterialIcons
              style={styles.buttonIcon}
              name="skip-next"
              color="white"
            />
          }
          onPress={() => getNewContact()}
        ></Button>
        <Button
          buttonStyle={styles.removeButton}
          icon={
            <MaterialIcons
              style={styles.buttonIcon}
              name="remove-circle"
              account-box
              color="white"
            />
          }
          onPress={async () => {
            await addCurrentToBlacklist();
            getNewContact();
          }}
        ></Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  card: {
    flex: 6,
    justifyContent: "center",
    alignItems: "center",
    width: 300,
    height: 70
  },
  buttonIcon: {
    fontSize: 25
  },
  button: {
    margin: 5,
    backgroundColor: "#228888"
  },
  name: {
    fontSize: 25,
    textAlign: "center",
    fontFamily: "Mako-Regular",
    marginBottom: 25,
    fontWeight: "700",
    color: "#092121"
  },
  skipButton: {
    backgroundColor: "#d6a95a",
    margin: 5
  },
  removeButton: {
    backgroundColor: "#c55164",
    margin: 5
  },
  removeButtonContainer: {
    flex: 1,
    flexDirection: "row",
    marginBottom: 50
  },
  header: {
    paddingTop: Constants.statusBarHeight,
    backgroundColor: "#228888",
    alignSelf: "stretch"
  },
  headerTitle: {
    color: "#fff",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
    fontSize: 20,
    fontFamily: "Mako-Regular",
    fontWeight: "700"
  },
  placeholderImage: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    borderColor: "#134a4a",
    borderWidth: 5,
    borderRadius: 5
  },
  placeholderImageText: {
    color: "#134a4a",
    fontSize: 25,
    fontWeight: "bold"
  },
  contactImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginBottom: 25
  }
});
