/**
 * Notifications Application
 * Handles user notification display and management
 */

// Constants and configuration
const apiUrl = '/data/data.json';
const domSelectors = {
  notificationsList: '.notifications-list',
  notificationsHeading: '.notifications-heading',
  markAllButton: '.mark-all',
  notificationsCount: '.notifications-count',
};

// Application state
const appState = {
  notifications: [],
};

// Initialize main event listeners
function initEventListeners() {
  const markAllAsReadButton = document.querySelector(
    domSelectors.markAllButton
  );
  if (markAllAsReadButton) {
    markAllAsReadButton.addEventListener('click', markAllAsRead);
  }
}

// Start the application
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  appInit();
});

/**
 * Fetches notification data from the API
 * @param {string} apiUrl - API URL to fetch data from
 * @returns {Promise<Array>} - Promise with notification data
 */
async function fetchData(apiUrl) {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(
        `Error loading data: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error in fetch operation:', error);
    // Show error message to user
    document
      .querySelector(domSelectors.notificationsList)
      ?.insertAdjacentHTML(
        'beforeend',
        `<div class="error-message">Could not load notifications</div>`
      );
    return [];
  }
}

function notificationTemplate(notificationData) {
  const {
    id: notificationId,
    status: notificationStatus,
    time: notificationTime,
    content,
  } = notificationData;
  const {
    type: notificationType,
    user,
    title: notificationTitle = '',
    group: notificationGroup = '',
    url: notificationUrl = '',
    message: notificationMessage = '',
    picture: notificationPicture = '',
  } = content;
  const { name: userName, avatar: avatarUrl } = user;

  const coreTemplate = `
   <article class="notification-item" data-id=${notificationId} data-status=${notificationStatus}>
    <img src=${avatarUrl} alt="" class="avatar"/>
    <div class="notification-main">
      ${notificationContentTemplate(notificationType, {
        notificationTime,
        userName,
        notificationTitle,
        notificationGroup,
        notificationUrl,
        notificationMessage,
        notificationPicture,
      })}
    </div>
  </article>
  `;

  return coreTemplate;
}

function notificationContentTemplate(notificationType, notificationContent) {
  const {
    notificationTime,
    userName,
    notificationTitle,
    notificationGroup,
    notificationUrl,
    notificationMessage,
    notificationPicture,
  } = notificationContent;
  switch (notificationType) {
    case 'reaction':
      return `
      <div class="notification-content">
        <p class="notification-text">
          <strong class="user-name">${userName}</strong> reacted to your post
          <strong class="notification-strong">
          ${notificationTitle}
          </strong>
        </p>
      </div>
      <div class="notification-footer">
        <p>${notificationTime}</p>
      </div>
      `;
    case 'follow':
      return `
      <div class="notification-content">
        <p class="notification-text">
          <strong class="user-name">${userName}</strong> followed you
        </p>
      </div>
      <div class="notification-footer">
        <p>${notificationTime}</p>
      </div>
      `;
    case 'join':
      return `
      <div class="notification-content">
        <p class="notification-text">
          <strong class="user-name">${userName}</strong> has joined your group
          <strong class="notification-link">
          <a href="${notificationUrl}" target="_blank">${notificationGroup}</a>
          </strong>
        </p>
      </div>
      <div class="notification-footer">
        <p>${notificationTime}</p>
      </div>
      `;
    case 'leave':
      return `
      <div class="notification-content">
        <p class="notification-text">
          <strong class="user-name">${userName}</strong> left the group
          <strong class="notification-link">
          <a href="${notificationUrl}" target="_blank">${notificationGroup}</a>
          </strong>
        </p>
      </div>
      <div class="notification-footer">
        <p>${notificationTime}</p>
      </div>
      `;
    case 'pm':
      return `
      <div class="notification-content">
        <p class="notification-text">
          <strong class="user-name">${userName}</strong> sent you a private message
        </p>
      </div>
      <div class="notification-footer">
        <p>${notificationTime}</p>
      </div>
      <p class="notification-dm">
        ${notificationMessage}
      </p>
      `;
    case 'comment':
      return `
      <div class="notification-content">
        <p class="notification-text">
          <strong class="user-name">${userName}</strong> commented on your picture
        </p>
        <img src=${notificationPicture} alt="" class="notification-image"/>
      </div>
      <div class="notification-footer">
        <p>${notificationTime}</p>
      </div>
      `;
  }
}

/**
 * Adds event listener and visual indicator to a notification
 * @param {HTMLElement} notificationItem - Notification element
 */
function addNotificationListener(notificationItem) {
  if (!(notificationItem instanceof HTMLElement)) {
    console.error('The notification element is not valid');
    return;
  }

  const notificationText = notificationItem.querySelector('.notification-text');
  if (!notificationText) {
    console.error('Invalid notification structure');
    return;
  }
  // Add visual indicator for unread status if needed
  if (notificationItem.dataset.status === 'unread') {
    notificationText.insertAdjacentHTML(
      'beforeend',
      '<span class="notification-active"></span>'
    );
    notificationItem.classList.add('notification-unread');
  }

  // Add click event to mark notification as read
  notificationItem.addEventListener('click', (event) => {
    if (notificationItem.dataset.status === 'unread') {
      event.stopPropagation();
      notificationItem.dataset.status = 'read';
      const indicator = notificationText.querySelector('.notification-active');
      if (indicator) indicator.remove();
      notificationItem.classList.remove('notification-unread');

      // Update notification count
      updateNotificationsCount();
    }
  });
}

/**
 * Creates and configures a notification element in the DOM
 * @param {Object} notificationItem - Notification data
 * @param {Array} notificationsArray - Array to store element references
 * @param {Function} listenerCallback - Function to add listener to the element
 */
function createHtmlElement(
  notificationItem,
  notificationsArray,
  listenerCallback
) {
  // Get the notifications list element
  const notificationsListElement = document.querySelector(
    domSelectors.notificationsList
  );
  if (!notificationsListElement) return;

  const notificationCoreTemplate = notificationTemplate(notificationItem);
  notificationsListElement.insertAdjacentHTML(
    'beforeend',
    notificationCoreTemplate
  );

  const notificationElement = notificationsListElement.lastElementChild;
  listenerCallback(notificationElement);

  // Store reference to created element
  notificationsArray.push(notificationElement);

  // Update application state
  appState.notifications.push({
    element: notificationElement,
    data: notificationItem,
  });
}

/**
 * Generates HTML to display the notification counter
 * @param {number} count - Number of unread notifications
 * @returns {string} - HTML for the notification counter
 */
function notificationsCountTemplate(count) {
  return `<span class="notifications-count">${count}</span>`;
}

/**
 * Updates the unread notifications counter
 */
function updateNotificationsCount() {
  const countElement = document.querySelector(domSelectors.notificationsCount);
  if (!countElement) return;

  const unreadCount = appState.notifications.reduce((acc, notification) => {
    return notification.element.dataset.status === 'unread' ? acc + 1 : acc;
  }, 0);

  countElement.textContent = unreadCount;
}

/**
 * Marks all notifications as read
 */
function markAllAsRead() {
  appState.notifications.forEach(({ element }) => {
    if (element.dataset.status === 'unread') {
      element.dataset.status = 'read';
      const notificationText = element.querySelector('.notification-text');
      const indicator = notificationText?.querySelector('.notification-active');
      if (indicator) indicator.remove();

      element.classList.remove('notification-unread');
    }
  });

  updateNotificationsCount();
}

/**
 * Initializes the application by loading data and setting up the UI
 */
async function appInit() {
  const notificationsData = await fetchData(apiUrl);

  if (Array.isArray(notificationsData) && notificationsData.length > 0) {
    notificationsData.forEach((notification) => {
      createHtmlElement(notification, [], addNotificationListener);
    });
    // Insert notification counter
    const notificationsHeadingElement = document.querySelector(
      domSelectors.notificationsHeading
    );
    if (notificationsHeadingElement) {
      const unreadCount = appState.notifications.filter(
        (notification) => notification.element.dataset.status === 'unread'
      ).length;

      notificationsHeadingElement.insertAdjacentHTML(
        'beforeend',
        notificationsCountTemplate(unreadCount)
      );
    }
  }
}
