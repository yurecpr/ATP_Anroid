import React from 'react';
import { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
// import Markdown from 'react-native-markdown-display';
import Markdown from 'react-native-markdown-package';
import { serverUrl } from '../config';
const PostScreen = ({route}) => {
  const [post, setPost] = useState(route.params);

  const markdownContent = post.content.replaceAll("${serverUrl}", serverUrl);

  // [![Видео](${serverUrl}/975d051f-ef1e-4f57-8e19-8210e27e2a0f.jpg)](https://www.youtube.com/watch?v=xW9DJTvB3NI)

  // ![Описание изображения](${serverUrl}/975d051f-ef1e-4f57-8e19-8210e27e2a0f.jpg)`;

  return (
    <View style={{ padding: 16 }}>
      <ScrollView>
        <Markdown  styles={styles} >
        {markdownContent}
        </Markdown>
      </ScrollView>
    </View>
  );
  
};

const styles = StyleSheet.create({
  view: {

  },
  image: {
    height: 400, // Image maximum height
    alignSelf: 'center',
    resizeMode: 'contain', // The image will scale uniformly (maintaining aspect ratio)
  },
})


export default PostScreen;
