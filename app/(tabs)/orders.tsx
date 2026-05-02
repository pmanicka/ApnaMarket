import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function OrdersScreen() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    
    const fetchOrders = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, total_amount, order_status, created_at, items_json,
          listings ( title, category ),
          seller:users!seller_id ( name, mobile )
        `)
        .eq('buyer_id', profile.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Fetch orders error:", error);
        Alert.alert("Fetch Error", error.message);
      }
      
      if (!error && data) {
        setOrders(data);
      }
      setIsLoading(false);
    };

    fetchOrders();
  }, [profile]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContent}>
          <Text style={styles.emoji}>🛍️</Text>
          <Text style={styles.subtitle}>You haven't placed any orders yet.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>{item.listings?.title}</Text>
                <Text style={{ color: '#FF6B35', fontWeight: 'bold' }}>₹{item.total_amount}</Text>
              </View>
              
              <Text style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 12 }}>
                {new Date(item.created_at).toLocaleDateString()} • Seller: {item.seller?.name}
              </Text>

              <View style={{ backgroundColor: '#1A1A2E', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                {Object.values(item.items_json).map((cartItem: any, idx) => (
                  <Text key={idx} style={{ color: '#D1D5DB', fontSize: 14, marginBottom: 4 }}>
                    {cartItem.qty}x {cartItem.name} (₹{cartItem.price})
                  </Text>
                ))}
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#1E1428', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: '#FF6B35', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {item.order_status === 'pending' ? 'ORDERED' : item.order_status}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#2D2D44' },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  emptyContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 60, marginBottom: 20 },
  subtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 24 },
  orderCard: { backgroundColor: '#12121F', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#2D2D44' }
});
