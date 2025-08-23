"""Tests for UI action result helper functions."""

import pytest

from mcp_ui_server import (
    ui_action_result_intent,
    ui_action_result_link,
    ui_action_result_notification,
    ui_action_result_prompt,
    ui_action_result_tool_call,
)


class TestUIActionResultHelpers:
    """Test suite for UI action result helper functions."""

    def test_ui_action_result_tool_call(self):
        """Test creating a tool call action result."""
        result = ui_action_result_tool_call("testTool", {"param1": "value1"})
        expected = {
            "type": "tool",
            "payload": {
                "toolName": "testTool",
                "params": {"param1": "value1"},
            },
            "messageId": None,
        }
        assert result.model_dump() == expected

    def test_ui_action_result_prompt(self):
        """Test creating a prompt action result."""
        result = ui_action_result_prompt("Enter your name")
        expected = {
            "type": "prompt",
            "payload": {
                "prompt": "Enter your name",
            },
            "messageId": None,
        }
        assert result.model_dump() == expected

    def test_ui_action_result_link(self):
        """Test creating a link action result."""
        result = ui_action_result_link("https://example.com")
        expected = {
            "type": "link",
            "payload": {
                "url": "https://example.com",
            },
            "messageId": None,
        }
        assert result.model_dump() == expected

    def test_ui_action_result_intent(self):
        """Test creating an intent action result."""
        result = ui_action_result_intent("doSomething", {"data": "abc"})
        expected = {
            "type": "intent",
            "payload": {
                "intent": "doSomething",
                "params": {"data": "abc"},
            },
            "messageId": None,
        }
        assert result.model_dump() == expected

    def test_ui_action_result_notification(self):
        """Test creating a notification action result."""
        result = ui_action_result_notification("Success!")
        expected = {
            "type": "notify",
            "payload": {
                "message": "Success!",
            },
            "messageId": None,
        }
        assert result.model_dump() == expected

    def test_ui_action_result_tool_call_with_complex_params(self):
        """Test tool call action result with complex parameters."""
        complex_params = {
            "nested": {"key": "value"},
            "list": [1, 2, 3],
            "boolean": True,
            "number": 42,
        }
        result = ui_action_result_tool_call("complexTool", complex_params)
        expected = {
            "type": "tool",
            "payload": {
                "toolName": "complexTool",
                "params": complex_params,
            },
            "messageId": None,
        }
        assert result.model_dump() == expected

    def test_ui_action_result_intent_with_empty_params(self):
        """Test intent action result with empty parameters."""
        result = ui_action_result_intent("simpleIntent", {})
        expected = {
            "type": "intent",
            "payload": {
                "intent": "simpleIntent",
                "params": {},
            },
            "messageId": None,
        }
        assert result.model_dump() == expected