import React from 'react';
import { useState } from 'react';
import { ScrollView, View, StyleSheet, Linking, Text, TouchableOpacity } from 'react-native';
import { serverUrl } from '../config';

const PostScreen = ({route}) => {
  const [post, setPost] = useState(route.params);

  const markdownContent = post.content.replaceAll("${serverUrl}", serverUrl);

  const openLink = (url) => {
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        }
      })
      .catch(err => console.error('Error opening link:', err));
  };

  // Парсимо markdown
  const renderContent = (content) => {
    const lines = content.split('\n');
    const elements = [];

    lines.forEach((line, index) => {
      if (!line.trim()) {
        return; // Пропускаємо порожні рядки
      }

      // Заголовки (## текст)
      if (line.startsWith('## ')) {
        elements.push(
          <Text key={index} style={styles.heading}>
            {line.replace('## ', '')}
          </Text>
        );
      }
      // Списки (- текст з посиланням)
      else if (line.startsWith('- ')) {
        const text = line.replace('- ', '');
        elements.push(
          <View key={index} style={styles.listItem}>
            <Text style={styles.bullet}>• </Text>
            {renderLinks(text, index)}
          </View>
        );
      }
      // Звичайний текст
      else {
        elements.push(
          <View key={index} style={{marginBottom: 8}}>
            {renderLinks(line, index)}
          </View>
        );
      }
    });

    return elements;
  };

  // Парсимо посилання у рядку
  const renderLinks = (text, lineIndex) => {
    const parts = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      // Текст до посилання
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`${lineIndex}-text-${lastIndex}`} style={styles.text}>
            {text.substring(lastIndex, match.index)}
          </Text>
        );
      }

      // Посилання
      const linkText = match[1];
      const linkUrl = match[2];
      parts.push(
        <TouchableOpacity key={`${lineIndex}-link-${match.index}`} onPress={() => openLink(linkUrl)}>
          <Text style={styles.link}>{linkText}</Text>
        </TouchableOpacity>
      );

      lastIndex = linkRegex.lastIndex;
    }

    // Текст після останнього посилання
    if (lastIndex < text.length) {
      parts.push(
        <Text key={`${lineIndex}-text-${lastIndex}`} style={styles.text}>
          {text.substring(lastIndex)}
        </Text>
      );
    }

    return <Text>{parts}</Text>;
  };

  return (
    <View style={{ padding: 16 }}>
      <ScrollView>
        <View>
          {renderContent(markdownContent)}
        </View>
      </ScrollView>
    </View>
  );
  
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    color: '#333',
    fontFamily: 'OpenSans',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    fontFamily: 'OpenSans',
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FF6347',
    textDecorationLine: 'underline',
    fontFamily: 'OpenSans',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    fontFamily: 'OpenSans',
    marginRight: 8,
  }
})


export default PostScreen;
