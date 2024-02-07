import React, { useEffect, useState } from "react";
import { View, Text, StatusBar, TextInput, Button, FlatList, Image, TouchableOpacity } from "react-native";
import { openDatabase } from "react-native-sqlite-storage";

const db = openDatabase({
  name: "rn_sqlite",
});

const App = () => {
  const [category, setCategory] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [categories, setCategories] = useState([]);
  const [totalSize, setTotalSize] = useState(0); // New state for total image size

  useEffect(() => {
    const fetchData = async () => {
      await createTables();
      await getCategories();
      await calculateTotalSize(); // Calculate total size on component mount
    };
    fetchData();
  }, []);

  // Function to convert image URL to base64 string
  const getBase64FromImageUrl = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      return base64String.replace('data:', '').replace(/^.+,/, '');
    } catch (error) {
      console.log('Error:', error.message);
      return ''; // Return empty string on error
    }
  };

  const createTables = () => {
    db.transaction(txn => {
      txn.executeSql(
        `CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(20), image_base64 TEXT, picture_size INTEGER)`,
        [],
        (sqlTxn, res) => {
          console.log("table created successfully");
        },
        error => {
          console.log("error on creating table " + error.message);
        },
      );
    });
  };

  const addCategory = async () => {
    if (!category || !selectedImage) {
      alert("Enter category and select an image");
      return false;
    }

    try {
      const base64data = await getBase64FromImageUrl(selectedImage);
      const pictureSize = base64data.length; // Calculate image size

      db.transaction(txn => {
        txn.executeSql(
          `INSERT INTO categories (name, image_base64, picture_size) VALUES (?, ?, ?)`,
          [category, base64data, pictureSize],
          (sqlTxn, res) => {
            console.log(`${category} category added successfully`);
            getCategories();
            setCategory("");
            setSelectedImage("");
            calculateTotalSize(); // Recalculate total size after adding new category
          },
          error => {
            console.log("error on adding category " + error.message);
          },
        );
      });
    } catch (error) {
      console.log("Error fetching or converting image:", error);
    }
  };

  const getCategories = () => {
    db.transaction(txn => {
      txn.executeSql(
        `SELECT * FROM categories ORDER BY id DESC`,
        [],
        (sqlTxn, res) => {
          console.log("categories retrieved successfully");
          let len = res.rows.length;

          if (len > 0) {
            let results = [];
            for (let i = 0; i < len; i++) {
              let item = res.rows.item(i);
              results.push({ id: item.id, name: item.name, image_base64: item.image_base64, picture_size: item.picture_size });
            }
            setCategories(results);
            console.log(JSON.stringify(results));
          } else {
            setCategories([]);
          }
        },
        error => {
          console.log("error on getting categories " + error.message);
        },
      );
    });
  };

  const deleteCategory = (categoryId) => {
    db.transaction(txn => {
      txn.executeSql(
        `DELETE FROM categories WHERE id = ?`,
        [categoryId],
        (sqlTxn, res) => {
          console.log(`Category with id ${categoryId} deleted successfully`);
          getCategories();
          calculateTotalSize(); // Recalculate total size after deleting category
        },
        error => {
          console.log("Error deleting category: " + error.message);
        }
      );
    });
  };

  const calculateTotalSize = () => {
    db.transaction(txn => {
      txn.executeSql(
        `SELECT SUM(picture_size) AS totalSize FROM categories`,
        [],
        (sqlTxn, res) => {
          if (res.rows.length > 0) {
            const totalBytes = res.rows.item(0).totalSize || 0;
            const totalMB = (totalBytes / (1024 * 1024)).toFixed(2); // Convert bytes to MB
            setTotalSize(totalMB);
          } else {
            setTotalSize(0);
          }
        },
        error => {
          console.log("Error calculating total size: " + error.message);
        }
      );
    });
  };

  const renderCategory = ({ item }) => {
    const sizeInMB = (item.picture_size / (1024 * 1024)).toFixed(2);
    return (
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderColor: "#ddd",
      }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            style={{ width: 50, height: 50, marginRight: 10 }}
            source={{ uri: `data:image/jpeg;base64,${item.image_base64}` }}
          />
          <View>
            <Text>{item.name}</Text>
            <Text>Size: {sizeInMB} MB</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => deleteCategory(item.id)}>
          <Text style={{ color: "red", fontWeight: "bold" }}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View>
      <StatusBar backgroundColor="#222" />

      <View style={{ marginTop: 20 }}>
        <Text>Total Image Size: {totalSize} MB</Text>
      </View>

      <TextInput
        placeholder="Enter category"
        value={category}
        onChangeText={setCategory}
        style={{ marginHorizontal: 8 }}
      />

      <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 10 }}>
        <TouchableOpacity onPress={() => setSelectedImage("https://images.pexels.com/photos/10496911/pexels-photo-10496911.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1")}>
          <Image style={{ width: 50, height: 50 }} source={{ uri: "https://images.pexels.com/photos/10496911/pexels-photo-10496911.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" }} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedImage("https://www.signiant.com/wp-content/uploads/2018/03/yorkshire-dales-2444959_1920.jpg")}>
          <Image style={{ width: 50, height: 50 }} source={{ uri: "https://www.signiant.com/wp-content/uploads/2018/03/yorkshire-dales-2444959_1920.jpg" }} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedImage("https://c4.wallpaperflare.com/wallpaper/246/739/689/digital-digital-art-artwork-illustration-abstract-hd-wallpaper-preview.jpg")}>
          <Image style={{ width: 50, height: 50 }} source={{ uri: "https://c4.wallpaperflare.com/wallpaper/199/924/33/muscle-muscle-bodybuilding-press-wallpaper-preview.jpg" }} />
        </TouchableOpacity>

      </View>

      <Button title="Submit" onPress={addCategory} />

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
};

export default App;
