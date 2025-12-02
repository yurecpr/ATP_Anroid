import { StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

export const gStyle = StyleSheet.create({
    tabBarLabel: { fontSize: 18, textAlign: 'center' },
    tabBarIcon: {
        display: 'none',
    },
    container: {
        flex: 1,
        padding: 16,
      },
      input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 4,
        marginBottom: 16,
        paddingHorizontal: 8,
      },
      buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '90%',
      },
      errorMessage: {
        padding: 10,
        margin: 15,
        backgroundColor: '#f44336',
        fontSize: 18
      },
      textPlaceHolder:{
        alignItems: "flex-start"
      },
      fieldTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
        textAlign: 'left',
        // fontStyle: 'italic',
        // textDecorationLine: 'underline'
      },
      sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f44336',
        textAlign: 'center',
        padding: 10
      },
      deleteButton: {
        backgroundColor: 'tomato',
        padding: 10,
        borderRadius: 5,
      },
      deleteButtonText: {
        color: 'white',
        fontWeight: 'bold',
      },
      dropDownSelectedValue: {
        fontFamily:'OpenSans',
        fontSize: RFValue(16) 
      },
      dropDownNotSelectedValue: {
        color: 'red'
      },
      dropDownBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:'space-around'
      }
      
});