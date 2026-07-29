import React, { useState, useEffect } from "react";
import { Trash2, Plus, Download, Smartphone, Check, ShoppingBag, X } from "lucide-react";
import styles from "./ShoppingList.module.css";

export default function ShoppingList() {
  const [items, setItems] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [inputQty, setInputQty] = useState("");

  // Load shopping list from localstorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("shopping_list");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveToStorage = (updatedItems) => {
    setItems(updatedItems);
    localStorage.setItem("shopping_list", JSON.stringify(updatedItems));
  };

  const handleAddItem = (e) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const newItem = {
      id: `item_${Date.now()}`,
      name: inputValue.trim(),
      quantity: inputQty.trim() || "1",
      checked: false
    };

    const updated = [newItem, ...items];
    saveToStorage(updated);
    setInputValue("");
    setInputQty("");
  };

  const handleToggleCheck = (id) => {
    const updated = items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    saveToStorage(updated);
  };

  const handleDeleteItem = (id) => {
    const updated = items.filter(item => item.id !== id);
    saveToStorage(updated);
  };

  const handleClearAll = () => {
    if (window.confirm("Clear all items from your shopping list?")) {
      saveToStorage([]);
    }
  };

  const handleExportPDF = () => {
    // Basic text export fallback or alert
    const listText = items
      .map(item => `[${item.checked ? "x" : " "}] ${item.name} (${item.quantity})`)
      .join("\n");
    
    const blob = new Blob([`FRIDGETORECIPE SHOPPING LIST\n===========================\n\n${listText}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shopping_list.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Shopping List</h1>
          <p className={styles.pageSubtitle}>Keep track of ingredients needed for your culinary adventures.</p>
        </div>
        {items.length > 0 && (
          <button onClick={handleClearAll} className={styles.clearBtn}>
            Clear All
          </button>
        )}
      </div>

      <div className={styles.contentGrid}>
        {/* Left Side: Shopping items list */}
        <div className={`${styles.listCard} glass`}>
          <form onSubmit={handleAddItem} className={styles.addForm}>
            <input 
              type="text" 
              placeholder="Add item (e.g. Cheddar Cheese)..." 
              className={styles.inputName}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Qty (e.g. 200g)..." 
              className={styles.inputQty}
              value={inputQty}
              onChange={(e) => setInputQty(e.target.value)}
            />
            <button type="submit" className={styles.addBtn} aria-label="Add item">
              <Plus size={18} />
            </button>
          </form>

          {items.length === 0 ? (
            <div className={styles.emptyList}>
              <ShoppingBag size={48} className={styles.emptyIcon} />
              <p>Your shopping list is empty.</p>
              <p className={styles.emptySub}>Add ingredients from recipes, or type custom items above.</p>
            </div>
          ) : (
            <div className={styles.listContainer}>
              {items.map(item => (
                <div 
                  key={item.id} 
                  className={`${styles.listItem} ${item.checked ? styles.checkedItem : ""}`}
                  onClick={() => handleToggleCheck(item.id)}
                >
                  <div className={styles.checkbox}>
                    {item.checked && <Check size={14} strokeWidth={3} />}
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemQty}>{item.quantity}</span>
                  </div>
                  <button 
                    className={styles.itemDelete}
                    onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                    aria-label="Delete item"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Promotion & Export actions (similar to Panel 8) */}
        {items.length > 0 && (
          <div className={`${styles.actionCard} glass`}>
            <div className={styles.promoImage}>📦</div>
            <h3 style={{ fontWeight: 700, fontSize: "16px" }}>Everything you need</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", textAlign: "center", lineHeight: "1.4" }}>
              Export your list to a file or send it to your phone to have it handy in the supermarket.
            </p>
            <div className={styles.actionsList}>
              <button onClick={handleExportPDF} className={styles.exportBtn}>
                <Download size={16} />
                <span>Export List</span>
              </button>
              <button onClick={() => alert("Shopping list synced to mobile device mock context!")} className={styles.phoneBtn}>
                <Smartphone size={16} />
                <span>Send to Phone</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
